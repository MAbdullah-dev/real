"use server";

import bcrypt from "bcryptjs";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAgency } from "@/server/agency";
import { requireAuth } from "@/server/auth";

export type ProfileActionResult = { ok?: true; error?: string };

const profileSchema = z.object({
  name: z.string().min(2, "Enter your name."),
  image: z
    .string()
    .trim()
    .url("Enter a valid image URL.")
    .optional()
    .or(z.literal("")),
});

export async function updateProfileAction(
  input: z.input<typeof profileSchema>
): Promise<ProfileActionResult> {
  const session = await requireAuth();
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: parsed.data.name,
      image: parsed.data.image?.trim() || null,
    },
  });

  revalidatePath("/dashboard/settings");
  return { ok: true };
}

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: z.string().min(8, "Use at least 8 characters."),
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "New passwords do not match.",
    path: ["confirmPassword"],
  });

export async function changePasswordAction(
  input: z.input<typeof passwordSchema>
): Promise<ProfileActionResult> {
  const session = await requireAuth();
  const parsed = passwordSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });
  if (!user?.passwordHash) {
    return { error: "This account signs in with a social provider." };
  }

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!valid) return { error: "Your current password is incorrect." };

  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 10) },
  });

  return { ok: true };
}

const agentProfileSchema = z.object({
  agency: z.string().min(2, "Enter your agency name."),
  phone: z.string().min(6, "Enter an operations phone number."),
  bio: z.string().min(20, "Write at least a short introduction."),
});

export async function updateAgentProfileAction(
  input: z.input<typeof agentProfileSchema>
): Promise<ProfileActionResult> {
  const { session, agency } = await requireAgency();
  if (!agency) return { error: "No agency found." };

  const parsed = agentProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  await prisma.agency.update({
    where: { id: agency.id },
    data: {
      name: parsed.data.agency,
      phone: parsed.data.phone,
      bio: parsed.data.bio,
    },
  });

  updateTag("agents");
  updateTag("properties");
  updateTag(`agent-${session.user.id}`);
  revalidatePath("/agency/profile");
  return { ok: true };
}
