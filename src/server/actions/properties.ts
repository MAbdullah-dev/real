"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import type { Prisma, PropertyStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { isSettingEnabled } from "@/server/admin";
import { requireRole } from "@/server/auth";
import { propertyInputSchema, slugify, type PropertyInput } from "@/server/property-input";
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

function imageRows(images: string[]): Prisma.PropertyImageCreateWithoutPropertyInput[] {
  return images.map((url, index) => ({
    url,
    sortOrder: index,
    isCover: index === 0,
  }));
}

/**
 * Agents may not self-publish unless an admin has turned on auto-publish; only
 * an admin can move a listing straight to `published` otherwise.
 */
async function resolveStatus(requested: PropertyStatus, isAdmin: boolean): Promise<PropertyStatus> {
  if (isAdmin) return requested;
  if (requested === "published") return "pending_review";
  if (requested === "pending_review" && (await isSettingEnabled("autoPublishListings"))) {
    return "published";
  }
  return requested;
}

export async function createPropertyAction(input: PropertyInput): Promise<PropertyActionResult> {
  const session = await requireRole(["AGENT", "ADMIN"]);
  const parsed = propertyInputSchema.safeParse(input);
  if (!parsed.success) return flatten(parsed.error);

  const isAdmin = session.user.role === "ADMIN";
  if (!isAdmin) {
    const allowance = await getListingAllowance(session.user.id);
    if (!allowance.canCreate) {
      return {
        error: `Your ${allowance.planName} plan allows ${allowance.limit} listing${
          allowance.limit === 1 ? "" : "s"
        }. Upgrade to add more.`,
      };
    }
  }

  const values = parsed.data;
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
      status: await resolveStatus(values.status, isAdmin),
      agentId: session.user.id,
      images: { create: imageRows(values.images) },
    },
    select: { id: true, slug: true },
  });

  revalidateProperty(created.slug);
  redirect(`/agent/properties/${created.id}/edit?created=1`);
}

export async function updatePropertyAction(
  id: string,
  input: PropertyInput
): Promise<PropertyActionResult> {
  const session = await requireRole(["AGENT", "ADMIN"]);
  const parsed = propertyInputSchema.safeParse(input);
  if (!parsed.success) return flatten(parsed.error);

  const existing = await prisma.property.findUnique({
    where: { id },
    select: { id: true, slug: true, agentId: true, status: true },
  });
  if (!existing) return { error: "That listing no longer exists." };

  const isAdmin = session.user.role === "ADMIN";
  if (!isAdmin && existing.agentId !== session.user.id) {
    return { error: "You can only edit your own listings." };
  }

  const values = parsed.data;
  const slug = await uniqueSlug(values.title, id);
  const status = await resolveStatus(values.status, isAdmin);

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
        status,
        images: { create: imageRows(values.images) },
      },
    }),
  ]);

  revalidateProperty(existing.slug);
  revalidateProperty(slug);
  return {};
}

export async function deletePropertyAction(id: string): Promise<PropertyActionResult> {
  const session = await requireRole(["AGENT", "ADMIN"]);

  const existing = await prisma.property.findUnique({
    where: { id },
    select: { id: true, slug: true, agentId: true },
  });
  if (!existing) return { error: "That listing no longer exists." };

  if (session.user.role !== "ADMIN" && existing.agentId !== session.user.id) {
    return { error: "You can only delete your own listings." };
  }

  await prisma.property.delete({ where: { id } });
  revalidateProperty(existing.slug);
  redirect("/agent/properties");
}
