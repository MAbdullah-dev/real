"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import type { AgentStatus, Prisma, PropertyStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  assertCanSubmitListings,
  requireActiveAgencyForWrite,
  requireAgency,
} from "@/server/agency";
import { isSettingEnabled } from "@/server/admin";
import { parseAvailability } from "@/lib/viewings";
import { propertyInputSchema, slugify, type PropertyInput, type PropertyValues } from "@/server/property-input";
import { canCreateProperty, canPublishProperty, canSubmitProperty } from "@/server/property-permissions";
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
  requireSlots: boolean
): { slots: Date[] } | { error: string } {
  const filled = (values.availableSlots ?? []).filter((slot) => slot.trim());
  if (filled.length === 0) {
    if (requireSlots) return { error: "Add at least one viewing time buyers can book." };
    return { slots: [] };
  }
  return parseAvailability(filled);
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

  if (requested === "published" || requested === "pending_review") {
    if (await isSettingEnabled("autoPublishListings")) {
      return { status: "published" };
    }
    return { status: "pending_review" };
  }

  return { status: requested };
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

  if (requested === "published" || requested === "pending_review") {
    if (await isSettingEnabled("autoPublishListings")) {
      return { status: "published" };
    }
    return { status: "pending_review" };
  }

  return { status: requested };
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

  const avail = availabilityRows(values, false);
  if ("error" in avail) return { error: avail.error };

  const slug = await uniqueSlug(values.title, id);

  await prisma.$transaction([
    prisma.propertyImage.deleteMany({ where: { propertyId: id } }),
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
        status: resolved.status,
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

  const avail = availabilityRows(values, resolved.status !== "draft");
  if ("error" in avail) return { error: avail.error };

  const slug = await uniqueSlug(values.title, id);

  await prisma.$transaction([
    prisma.propertyImage.deleteMany({ where: { propertyId: id } }),
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
        status: resolved.status,
        images: { create: imageRows(values.images) },
      },
    }),
  ]);

  revalidateProperty(existing.slug);
  revalidateProperty(slug);
  return {};
}

export async function deletePropertyAction(id: string): Promise<PropertyActionResult> {
  const ctx = await requireAgency();

  const existing = await prisma.property.findUnique({
    where: { id },
    select: { id: true, slug: true, agentId: true, agencyId: true },
  });
  if (!existing) return { error: "That listing no longer exists." };

  if (!ctx.isAdmin && (!ctx.agency || existing.agencyId !== ctx.agency.id)) {
    return { error: "You can only delete your agency's listings." };
  }

  await prisma.property.delete({ where: { id } });
  revalidateProperty(existing.slug);
  redirect("/agency/properties");
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
  redirect("/seller/properties");
}

/** Used by layout to soft-gate without throwing. */
export async function getAgentGateContext() {
  return requireAgency();
}
