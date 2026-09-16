"use server";

import { revalidatePath, updateTag } from "next/cache";
import type { AgentStatus, CredentialStatus } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { createAgencyForUser } from "@/server/agency";
import { requireRole } from "@/server/auth";
import { createNotification } from "@/server/notifications";
import { slugify } from "@/server/property-input";

export type AdminActionResult = { ok?: true; error?: string };

async function requireAdmin() {
  return requireRole(["ADMIN"]);
}

/* ---------------------------------------------------------------- moderation */

const moderateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["draft", "pending_review", "published", "rejected"]),
});

export async function moderatePropertyAction(
  input: z.input<typeof moderateSchema>
): Promise<AdminActionResult> {
  await requireAdmin();
  const parsed = moderateSchema.safeParse(input);
  if (!parsed.success) return { error: "Unsupported status." };

  const property = await prisma.property.update({
    where: { id: parsed.data.id },
    data: { status: parsed.data.status },
    select: { title: true, slug: true, agentId: true },
  });

  const copy: Record<string, string> = {
    published: "is now live",
    rejected: "was rejected",
    draft: "was moved back to draft",
    pending_review: "is queued for review",
  };
  await createNotification(
    property.agentId,
    "Listing status changed",
    `${property.title} ${copy[parsed.data.status]}.`
  );

  updateTag("properties");
  updateTag(`property-${property.slug}`);
  updateTag("agents");
  revalidatePath("/admin/properties");
  return { ok: true };
}

/* --------------------------------------------------------------------- users */

const roleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["USER", "SELLER", "BROKER", "AGENCY", "ADMIN"]),
});

export async function setUserRoleAction(
  input: z.input<typeof roleSchema>
): Promise<AdminActionResult> {
  const session = await requireAdmin();
  const parsed = roleSchema.safeParse(input);
  if (!parsed.success) return { error: "Unsupported role." };

  if (parsed.data.userId === session.user.id && parsed.data.role !== "ADMIN") {
    return { error: "You cannot remove your own admin access." };
  }

  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { role: parsed.data.role },
  });

  if (parsed.data.role === "AGENCY") {
    const existing = await prisma.agencyMember.findUnique({
      where: { userId: parsed.data.userId },
    });
    if (!existing) {
      await createAgencyForUser(parsed.data.userId, { type: "agency" });
    }
  }

  if (parsed.data.role === "BROKER") {
    const existing = await prisma.brokerProfile.findUnique({
      where: { userId: parsed.data.userId },
    });
    if (!existing) {
      await prisma.brokerProfile.create({
        data: { userId: parsed.data.userId, status: "onboarding", onboardingStep: 0 },
      });
    }
  }

  if (parsed.data.role === "SELLER") {
    const existing = await prisma.sellerProfile.findUnique({
      where: { userId: parsed.data.userId },
    });
    if (!existing) {
      await prisma.sellerProfile.create({
        data: { userId: parsed.data.userId, status: "onboarding", onboardingStep: 0 },
      });
    }
  }

  updateTag("agents");
  revalidatePath("/admin/users");
  revalidatePath("/admin/agencies");
  revalidatePath("/admin/brokers");
  revalidatePath("/admin/sellers");
  return { ok: true };
}

const agencyStatusSchema = z.object({
  agencyId: z.string().min(1),
  status: z.enum(["active", "rejected", "suspended", "pending_review"]),
  statusNote: z.string().max(2000).optional(),
});

export async function setAgencyStatusAction(
  input: z.input<typeof agencyStatusSchema>
): Promise<AdminActionResult> {
  const session = await requireAdmin();
  const parsed = agencyStatusSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid status update." };

  if (parsed.data.status === "rejected" && !parsed.data.statusNote?.trim()) {
    return { error: "Add a short note explaining the rejection." };
  }

  const agency = await prisma.agency.update({
    where: { id: parsed.data.agencyId },
    data: {
      status: parsed.data.status as AgentStatus,
      statusNote: parsed.data.statusNote?.trim() || null,
      reviewedAt: new Date(),
      reviewedById: session.user.id,
    },
    include: {
      members: { where: { role: "owner" }, select: { userId: true }, take: 1 },
    },
  });

  const ownerId = agency.members[0]?.userId;
  if (ownerId) {
    const titles: Record<string, string> = {
      active: "Agency approved",
      rejected: "Application needs changes",
      suspended: "Agency suspended",
      pending_review: "Back in review",
    };
    await createNotification(
      ownerId,
      titles[parsed.data.status] ?? "Agency status updated",
      parsed.data.statusNote?.trim() ||
        `Your agency status is now ${parsed.data.status.replace("_", " ")}.`
    );
    updateTag(`agent-${ownerId}`);
  }

  updateTag("agents");
  updateTag("properties");
  revalidatePath("/admin/agencies");
  return { ok: true };
}

const brokerStatusSchema = z.object({
  userId: z.string().min(1),
  status: z.enum(["active", "rejected", "suspended", "pending_review"]),
  statusNote: z.string().max(2000).optional(),
});

export async function setBrokerStatusAction(
  input: z.input<typeof brokerStatusSchema>
): Promise<AdminActionResult> {
  await requireAdmin();
  const parsed = brokerStatusSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid status update." };

  if (parsed.data.status === "rejected" && !parsed.data.statusNote?.trim()) {
    return { error: "Add a short note explaining the rejection." };
  }

  await prisma.brokerProfile.update({
    where: { userId: parsed.data.userId },
    data: {
      status: parsed.data.status as AgentStatus,
      statusNote: parsed.data.statusNote?.trim() || null,
      reviewedAt: new Date(),
    },
  });

  const titles: Record<string, string> = {
    active: "Broker account approved",
    rejected: "Broker application needs changes",
    suspended: "Broker account suspended",
    pending_review: "Back in review",
  };
  await createNotification(
    parsed.data.userId,
    titles[parsed.data.status] ?? "Broker status updated",
    parsed.data.statusNote?.trim() ||
      `Your broker status is now ${parsed.data.status.replace("_", " ")}.`
  );

  revalidatePath("/admin/brokers");
  revalidatePath("/admin/users");
  return { ok: true };
}

const sellerStatusSchema = z.object({
  userId: z.string().min(1),
  status: z.enum(["active", "rejected", "suspended", "pending_review"]),
  statusNote: z.string().max(2000).optional(),
});

export async function setSellerStatusAction(
  input: z.input<typeof sellerStatusSchema>
): Promise<AdminActionResult> {
  const session = await requireAdmin();
  const parsed = sellerStatusSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid status update." };

  if (parsed.data.status === "rejected" && !parsed.data.statusNote?.trim()) {
    return { error: "Add a short note explaining the rejection." };
  }

  await prisma.sellerProfile.update({
    where: { userId: parsed.data.userId },
    data: {
      status: parsed.data.status as AgentStatus,
      statusNote: parsed.data.statusNote?.trim() || null,
      reviewedAt: new Date(),
    },
  });

  const titles: Record<string, string> = {
    active: "Seller account approved",
    rejected: "Seller application needs changes",
    suspended: "Seller account suspended",
    pending_review: "Back in review",
  };
  await createNotification(
    parsed.data.userId,
    titles[parsed.data.status] ?? "Seller status updated",
    parsed.data.statusNote?.trim() ||
      `Your seller status is now ${parsed.data.status.replace("_", " ")}.`
  );

  revalidatePath("/admin/sellers");
  revalidatePath("/admin/users");
  void session;
  return { ok: true };
}

const credentialReviewSchema = z.object({
  credentialId: z.string().min(1),
  status: z.enum(["approved", "rejected", "pending"]),
  reviewNote: z.string().max(1000).optional(),
});

export async function reviewCredentialAction(
  input: z.input<typeof credentialReviewSchema>
): Promise<AdminActionResult> {
  await requireAdmin();
  const parsed = credentialReviewSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid credential review." };

  if (parsed.data.status === "rejected" && !parsed.data.reviewNote?.trim()) {
    return { error: "Explain what needs to be fixed." };
  }

  await prisma.agentCredential.update({
    where: { id: parsed.data.credentialId },
    data: {
      status: parsed.data.status as CredentialStatus,
      reviewNote: parsed.data.reviewNote?.trim() || null,
    },
  });

  revalidatePath("/admin/agencies");
  return { ok: true };
}

/** @deprecated Prefer setAgencyStatusAction. */
export async function setAgentVerifiedAction(
  userId: string,
  verified: boolean
): Promise<AdminActionResult> {
  const membership = await prisma.agencyMember.findUnique({
    where: { userId },
    select: { agencyId: true },
  });
  if (!membership) return { error: "No agency for that user." };
  return setAgencyStatusAction({
    agencyId: membership.agencyId,
    status: verified ? "active" : "suspended",
  });
}

/* ------------------------------------------------------------------ settings */

export async function setAdminSettingAction(
  key: string,
  value: boolean
): Promise<AdminActionResult> {
  await requireAdmin();

  await prisma.adminSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });

  revalidatePath("/admin/settings");
  return { ok: true };
}

/* ----------------------------------------------------------------------- CMS */

const postSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(4, "Give the post a title."),
  excerpt: z.string().min(10, "Write a short excerpt."),
  body: z.string().min(40, "The body needs a bit more content."),
  published: z.boolean(),
});

export async function saveBlogPostAction(
  input: z.input<typeof postSchema>
): Promise<AdminActionResult> {
  await requireAdmin();
  const parsed = postSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  const { id, title, excerpt, body, published } = parsed.data;
  const publishedAt = published ? new Date() : null;

  if (id) {
    const existing = await prisma.blogPost.findUnique({
      where: { id },
      select: { publishedAt: true },
    });
    await prisma.blogPost.update({
      where: { id },
      data: {
        title,
        excerpt,
        body,
        publishedAt: published ? (existing?.publishedAt ?? publishedAt) : null,
      },
    });
  } else {
    await prisma.blogPost.create({
      data: {
        slug: `${slugify(title)}-${Date.now().toString(36)}`,
        title,
        excerpt,
        body,
        publishedAt,
      },
    });
  }

  updateTag("content");
  revalidatePath("/admin/cms");
  return { ok: true };
}

export async function deleteBlogPostAction(id: string): Promise<AdminActionResult> {
  await requireAdmin();
  await prisma.blogPost.delete({ where: { id } });

  updateTag("content");
  revalidatePath("/admin/cms");
  return { ok: true };
}

const faqSchema = z.object({
  id: z.string().optional(),
  question: z.string().min(6, "Write the question."),
  answer: z.string().min(10, "Write the answer."),
  sortOrder: z.coerce.number().int().min(0).default(0),
  published: z.boolean(),
});

export async function saveFaqAction(
  input: z.input<typeof faqSchema>
): Promise<AdminActionResult> {
  await requireAdmin();
  const parsed = faqSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  const { id, ...data } = parsed.data;
  if (id) {
    await prisma.faqItem.update({ where: { id }, data });
  } else {
    await prisma.faqItem.create({ data });
  }

  updateTag("content");
  revalidatePath("/admin/cms");
  return { ok: true };
}

export async function deleteFaqAction(id: string): Promise<AdminActionResult> {
  await requireAdmin();
  await prisma.faqItem.delete({ where: { id } });

  updateTag("content");
  revalidatePath("/admin/cms");
  return { ok: true };
}
