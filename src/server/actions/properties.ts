"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import type { AgentStatus, Prisma, PropertyStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/server/auth";
import {
  assertCanSubmitListings,
  requireActiveAgencyForWrite,
  requireAgency,
} from "@/server/agency";
import {
  DEFAULT_BUFFER_MIN,
  DEFAULT_DURATION_MIN,
  OPEN_VIEWING_STATUSES,
  parseAvailabilityWindows,
  slotInList,
  visitEndOf,
  type AvailabilityWindowSpec,
} from "@/lib/viewings";
import { propertyInputSchema, slugify, type PropertyInput, type PropertyValues } from "@/server/property-input";
import {
  canCreateProperty,
  canDeleteProperty,
  canPublishProperty,
  canSubmitProperty,
} from "@/server/property-permissions";
import { nextStatusOnSave, resubmitBlockReason, submittedListingStatus } from "@/server/property-review";
import { resubmitPropertyAs } from "@/server/property-review-apply";
import {
  getSellerListingAllowance,
  requireActiveSellerForWrite,
  requireSeller,
} from "@/server/seller";
import { getListingAllowance } from "@/server/subscriptions";

export type PropertyActionResult = { error?: string; fieldErrors?: Record<string, string> };

function revalidateProperty(slug?: string) {
  updateTag("properties");
  updateTag("agents");
  if (slug) updateTag(`property-${slug}`);
}

function flatten(error: import("zod").ZodError): PropertyActionResult {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    fieldErrors[key] ??= issue.message;
  }
  return { error: "Please fix the highlighted fields.", fieldErrors };
}

async function uniqueSlug(title: string, ignoreId?: string) {
  const base = slugify(title) || "listing";
  let candidate = base;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const clash = await prisma.property.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!clash || clash.id === ignoreId) return candidate;
    candidate = `${base}-${attempt + 2}`;
  }
  return `${base}-${Date.now()}`;
}

function availabilityRows(
  values: PropertyValues,
  requireWindows: boolean
): { windows: AvailabilityWindowSpec[]; slots: Date[] } | { error: string } {
  const rows = (values.availabilityWindows ?? []).filter(
    (window) => window.start.trim() && window.end.trim()
  );
  if (rows.length > 0) return parseAvailabilityWindows(rows);

  const filled = (values.availableSlots ?? []).filter((slot) => slot.trim());
  if (filled.length === 0) {
    if (requireWindows) return { error: "Add at least one viewing window buyers can book." };
    return { windows: [], slots: [] };
  }
  return parseAvailabilityWindows(
    filled.map((start) => {
      const time = new Date(start);
      return {
        start: time.toISOString(),
        end: visitEndOf(time, DEFAULT_DURATION_MIN).toISOString(),
        durationMin: DEFAULT_DURATION_MIN,
        bufferMin: DEFAULT_BUFFER_MIN,
      };
    })
  );
}

function windowCreates(
  windows: AvailabilityWindowSpec[],
  timezone?: string
) {
  return windows.map((window) => ({
    start: window.start,
    end: window.end,
    durationMin: window.durationMin,
    bufferMin: window.bufferMin,
    timezone: timezone || "UTC",
  }));
}

async function windowsKeepOpenBookings(propertyId: string, slots: Date[]) {
  const open = await prisma.booking.findMany({
    where: { propertyId, status: { in: OPEN_VIEWING_STATUSES }, visitDate: { not: null } },
    select: { visitDate: true },
  });
  const lost = open.filter((row) => row.visitDate && !slotInList(row.visitDate, slots));
  if (lost.length === 0) return;
  return `This change would drop ${lost.length} open viewing${lost.length === 1 ? "" : "s"}. Cancel or complete them first.`;
}

function imageRows(images: string[]): Prisma.PropertyImageCreateWithoutPropertyInput[] {
  return images.map((url, index) => ({
    url,
    sortOrder: index,
    isCover: index === 0,
  }));
}

async function resolveAgencyStatus(
  requested: PropertyStatus,
  isAdmin: boolean,
  agencyStatus: string | null
): Promise<{ status: PropertyStatus; error?: string }> {
  if (isAdmin) return { status: requested };
  if (requested === "draft") return { status: "draft" };

  const submitBlock = await assertCanSubmitListings(
    (agencyStatus as AgentStatus) || "onboarding",
    false
  );
  if (submitBlock) return { status: "draft", error: submitBlock };

  return { status: submittedListingStatus(requested, false) };
}

async function resolveSellerStatus(
  requested: PropertyStatus,
  actor: { role: "SELLER" | "ADMIN"; accountStatus: AgentStatus }
): Promise<{ status: PropertyStatus; error?: string }> {
  if (canPublishProperty(actor)) return { status: requested };
  if (requested === "draft") return { status: "draft" };

  if (!canSubmitProperty(actor)) {
    return {
      status: "draft",
      error: "Your seller account must be approved before listings go live.",
    };
  }

  return { status: submittedListingStatus(requested, false) };
}

export async function createPropertyAction(input: PropertyInput): Promise<PropertyActionResult> {
  const ctx = await requireActiveAgencyForWrite();
  const parsed = propertyInputSchema.safeParse(input);
  if (!parsed.success) return flatten(parsed.error);

  const isAdmin = ctx.isAdmin;
  const agencyId = ctx.agency?.id;
  if (!isAdmin && !agencyId) return { error: "Complete agency onboarding first." };

  if (!isAdmin) {
    const allowance = await getListingAllowance(ctx.session.user.id);
    if (!allowance.canCreate) {
      return {
        error: `Your ${allowance.planName} plan allows ${allowance.limit} listing${
          allowance.limit === 1 ? "" : "s"
        }. Upgrade to add more.`,
      };
    }
  }

  let targetAgencyId = agencyId;
  if (!targetAgencyId) {
    const fallback = await prisma.agency.findFirst({
      where: { status: "active" },
      select: { id: true },
    });
    if (!fallback) return { error: "No agency available to own this listing." };
    targetAgencyId = fallback.id;
  }

  const values = parsed.data;
  const resolved = await resolveAgencyStatus(values.status, isAdmin, ctx.agency?.status ?? null);
  if (resolved.error && values.status !== "draft") return { error: resolved.error };

  const avail = availabilityRows(values, false);
  if ("error" in avail) return { error: avail.error };

  const slug = await uniqueSlug(values.title);

  const created = await prisma.property.create({
    data: {
      slug,
      title: values.title,
      description: values.description,
      address: values.address,
      city: values.city,
      country: values.country,
      price: values.price,
      purpose: values.purpose,
      bedrooms: values.bedrooms,
      bathrooms: values.bathrooms,
      areaSqm: values.areaSqm,
      furnished: values.furnished,
      videoUrl: values.videoUrl,
      categories: values.categories,
      amenities: values.amenities,
      badges: values.badges,
      availableSlots: avail.slots,
      availabilityWindows: { create: windowCreates(avail.windows, values.availabilityWindows[0]?.timezone) },
      status: resolved.status,
      agencyId: targetAgencyId,
      agentId: ctx.session.user.id,
      images: { create: imageRows(values.images) },
    },
    select: { id: true, slug: true },
  });

  revalidateProperty(created.slug);
  redirect(`/agency/properties/${created.id}/edit?created=1`);
}

export async function createSellerPropertyAction(
  input: PropertyInput
): Promise<PropertyActionResult> {
  const ctx = await requireActiveSellerForWrite();
  const parsed = propertyInputSchema.safeParse(input);
  if (!parsed.success) return flatten(parsed.error);

  if (!ctx.isAdmin) {
    const allowance = await getSellerListingAllowance(ctx.session.user.id);
    if (!allowance.canCreate) {
      return {
        error: `Sellers can keep up to ${allowance.limit} listings. Remove one to add another.`,
      };
    }
  }

  const actor = {
    role: ctx.isAdmin ? ("ADMIN" as const) : ("SELLER" as const),
    accountStatus: ctx.profile?.status ?? "onboarding",
  };
  if (!canCreateProperty(actor)) {
    return { error: "Your seller account cannot create listings yet." };
  }

  const values = parsed.data;
  const resolved = await resolveSellerStatus(values.status, actor);
  if (resolved.error && values.status !== "draft") return { error: resolved.error };

  const avail = availabilityRows(values, resolved.status !== "draft");
  if ("error" in avail) return { error: avail.error };

  const slug = await uniqueSlug(values.title);
  const created = await prisma.property.create({
    data: {
      slug,
      title: values.title,
      description: values.description,
      address: values.address,
      city: values.city,
      country: values.country,
      price: values.price,
      purpose: values.purpose,
      bedrooms: values.bedrooms,
      bathrooms: values.bathrooms,
      areaSqm: values.areaSqm,
      furnished: values.furnished,
      videoUrl: values.videoUrl,
      categories: values.categories,
      amenities: values.amenities,
      badges: values.badges,
      availableSlots: avail.slots,
      availabilityWindows: { create: windowCreates(avail.windows, values.availabilityWindows[0]?.timezone) },
      status: resolved.status,
      sellerId: ctx.session.user.id,
      agentId: ctx.session.user.id,
      agencyId: null,
      images: { create: imageRows(values.images) },
    },
    select: { id: true, slug: true },
  });

  revalidateProperty(created.slug);
  redirect(`/seller/properties/${created.id}/edit?created=1`);
}

export async function updatePropertyAction(
  id: string,
  input: PropertyInput
): Promise<PropertyActionResult> {
  const ctx = await requireActiveAgencyForWrite();
  const parsed = propertyInputSchema.safeParse(input);
  if (!parsed.success) return flatten(parsed.error);

  const existing = await prisma.property.findUnique({
    where: { id },
    select: { id: true, slug: true, agentId: true, agencyId: true, status: true },
  });
  if (!existing) return { error: "That listing no longer exists." };

  const isAdmin = ctx.isAdmin;
  if (!isAdmin && (!ctx.agency || existing.agencyId !== ctx.agency.id)) {
    return { error: "You can only edit your agency's listings." };
  }

  const values = parsed.data;
  const resolved = await resolveAgencyStatus(values.status, isAdmin, ctx.agency?.status ?? null);
  if (resolved.error && values.status !== "draft") return { error: resolved.error };
  const status = nextStatusOnSave(existing.status, resolved.status, isAdmin);

  const avail = availabilityRows(values, false);
  if ("error" in avail) return { error: avail.error };
  const blocked = await windowsKeepOpenBookings(id, avail.slots);
  if (blocked) return { error: blocked };

  const slug = await uniqueSlug(values.title, id);

  await prisma.$transaction([
    prisma.propertyImage.deleteMany({ where: { propertyId: id } }),
    prisma.availabilityWindow.deleteMany({ where: { propertyId: id } }),
    prisma.property.update({
      where: { id },
      data: {
        slug,
        title: values.title,
        description: values.description,
        address: values.address,
        city: values.city,
        country: values.country,
        price: values.price,
        purpose: values.purpose,
        bedrooms: values.bedrooms,
        bathrooms: values.bathrooms,
        areaSqm: values.areaSqm,
        furnished: values.furnished,
        videoUrl: values.videoUrl ?? null,
        categories: values.categories,
        amenities: values.amenities,
        badges: values.badges,
        availableSlots: avail.slots,
        availabilityWindows: { create: windowCreates(avail.windows, values.availabilityWindows[0]?.timezone) },
        status,
        images: { create: imageRows(values.images) },
      },
    }),
  ]);

  revalidateProperty(existing.slug);
  revalidateProperty(slug);
  return {};
}

export async function updateSellerPropertyAction(
  id: string,
  input: PropertyInput
): Promise<PropertyActionResult> {
  const ctx = await requireActiveSellerForWrite();
  const parsed = propertyInputSchema.safeParse(input);
  if (!parsed.success) return flatten(parsed.error);

  const existing = await prisma.property.findUnique({
    where: { id },
    select: { id: true, slug: true, sellerId: true, status: true },
  });
  if (!existing) return { error: "That listing no longer exists." };

  if (!ctx.isAdmin && existing.sellerId !== ctx.session.user.id) {
    return { error: "You can only edit your own listings." };
  }

  const actor = {
    role: ctx.isAdmin ? ("ADMIN" as const) : ("SELLER" as const),
    accountStatus: ctx.profile?.status ?? "onboarding",
  };
  const values = parsed.data;
  const resolved = await resolveSellerStatus(values.status, actor);
  if (resolved.error && values.status !== "draft") return { error: resolved.error };
  const status = nextStatusOnSave(existing.status, resolved.status, ctx.isAdmin);

  const avail = availabilityRows(values, status !== "draft");
  if ("error" in avail) return { error: avail.error };
  const blocked = await windowsKeepOpenBookings(id, avail.slots);
  if (blocked) return { error: blocked };

  const slug = await uniqueSlug(values.title, id);

  await prisma.$transaction([
    prisma.propertyImage.deleteMany({ where: { propertyId: id } }),
    prisma.availabilityWindow.deleteMany({ where: { propertyId: id } }),
    prisma.property.update({
      where: { id },
      data: {
        slug,
        title: values.title,
        description: values.description,
        address: values.address,
        city: values.city,
        country: values.country,
        price: values.price,
        purpose: values.purpose,
        bedrooms: values.bedrooms,
        bathrooms: values.bathrooms,
        areaSqm: values.areaSqm,
        furnished: values.furnished,
        videoUrl: values.videoUrl ?? null,
        categories: values.categories,
        amenities: values.amenities,
        badges: values.badges,
        availableSlots: avail.slots,
        availabilityWindows: { create: windowCreates(avail.windows, values.availabilityWindows[0]?.timezone) },
        status,
        images: { create: imageRows(values.images) },
      },
    }),
  ]);

  revalidateProperty(existing.slug);
  revalidateProperty(slug);
  return {};
}

export async function resubmitPropertyAction(id: string): Promise<PropertyActionResult> {
  const session = await requireAuth();
  const [property, membership, sellerProfile] = await Promise.all([
    prisma.property.findUnique({
      where: { id },
      select: { id: true, status: true, sellerId: true, agencyId: true, slug: true },
    }),
    prisma.agencyMember.findUnique({
      where: { userId: session.user.id },
      select: { agencyId: true, agency: { select: { status: true } } },
    }),
    prisma.sellerProfile.findUnique({
      where: { userId: session.user.id },
      select: { status: true },
    }),
  ]);
  if (!property) return { error: "That listing no longer exists." };

  const accountStatus =
    session.user.role === "AGENCY" ? membership?.agency.status : sellerProfile?.status;
  const blocked = resubmitBlockReason(
    {
      role: session.user.role,
      userId: session.user.id,
      agencyId: membership?.agencyId,
      accountStatus,
    },
    property
  );
  if (blocked) return { error: blocked };

  const result = await resubmitPropertyAs(prisma, property.id);
  if ("error" in result) return result;

  revalidateProperty(result.slug);
  revalidatePath("/admin/properties");
  revalidatePath(`/admin/properties/${result.id}`);
  revalidatePath("/agency/properties");
  revalidatePath("/seller/properties");
  revalidatePath(`/agency/properties/${result.id}/edit`);
  revalidatePath(`/seller/properties/${result.id}/edit`);
  revalidatePath(`/properties/${result.slug}`);
  return {};
}

export async function deletePropertyAction(id: string): Promise<PropertyActionResult> {
  const ctx = await requireAgency();

  const existing = await prisma.property.findUnique({
    where: { id },
    select: { id: true, slug: true, agentId: true, agencyId: true, sellerId: true },
  });
  if (!existing) return { error: "That listing no longer exists." };

  if (
    !canDeleteProperty(
      {
        role: ctx.session.user.role,
        userId: ctx.session.user.id,
        agencyId: ctx.agency?.id,
        accountStatus: ctx.agency?.status ?? "active",
      },
      existing
    )
  ) {
    return { error: "You can only delete your agency's listings." };
  }

  await prisma.property.delete({ where: { id } });
  revalidateProperty(existing.slug);
  return {};
}

export async function deleteSellerPropertyAction(id: string): Promise<PropertyActionResult> {
  const ctx = await requireSeller();

  const existing = await prisma.property.findUnique({
    where: { id },
    select: { id: true, slug: true, sellerId: true },
  });
  if (!existing) return { error: "That listing no longer exists." };

  if (!ctx.isAdmin && existing.sellerId !== ctx.session.user.id) {
    return { error: "You can only delete your own listings." };
  }

  await prisma.property.delete({ where: { id } });
  revalidateProperty(existing.slug);
  revalidatePath("/seller/properties");
  return {};
}

/** Used by layout to soft-gate without throwing. */
export async function getAgentGateContext() {
  return requireAgency();
}
