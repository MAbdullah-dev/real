"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
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
  role: z.enum(["USER", "AGENT", "ADMIN"]),
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

  if (parsed.data.role === "AGENT") {
    await prisma.agentProfile.upsert({
      where: { userId: parsed.data.userId },
      update: {},
      create: { userId: parsed.data.userId },
    });
  }

  updateTag("agents");
  revalidatePath("/admin/users");
  revalidatePath("/admin/agents");
  return { ok: true };
}

export async function setAgentVerifiedAction(
  userId: string,
  verified: boolean
): Promise<AdminActionResult> {
  await requireAdmin();

  await prisma.agentProfile.upsert({
    where: { userId },
    update: { verified },
    create: { userId, verified },
  });

  updateTag("agents");
  updateTag(`agent-${userId}`);
  revalidatePath("/admin/agents");
  return { ok: true };
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
