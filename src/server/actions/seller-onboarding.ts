"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireSeller } from "@/server/seller";

export type SellerOnboardingResult = { error?: string; ok?: true };

const profileSchema = z.object({
  phone: z.string().min(6, "Enter a reachable phone number."),
  country: z.string().min(2).max(2),
  city: z.string().min(2, "Enter your city."),
  bio: z.string().max(2000).optional(),
});

export async function saveSellerProfileAction(
  input: z.input<typeof profileSchema>
): Promise<SellerOnboardingResult> {
  const { session, profile, isAdmin } = await requireSeller();
  if (!isAdmin && profile?.status === "active") {
    // Active sellers can still edit contact details.
  }

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details." };
  }

  await prisma.sellerProfile.update({
    where: { userId: session.user.id },
    data: {
      phone: parsed.data.phone.trim(),
      country: parsed.data.country.toUpperCase(),
      city: parsed.data.city.trim(),
      bio: parsed.data.bio?.trim() || null,
      onboardingStep: Math.max(profile?.onboardingStep ?? 0, 1),
    },
  });

  revalidatePath("/seller");
  revalidatePath("/auth/onboarding/seller");
  return { ok: true };
}

export async function submitSellerForReviewAction(): Promise<SellerOnboardingResult> {
  const { session, profile, isAdmin } = await requireSeller();
  if (isAdmin) return { ok: true };

  if (!profile?.phone || !profile.country || !profile.city) {
    return { error: "Complete your profile before submitting." };
  }

  await prisma.sellerProfile.update({
    where: { userId: session.user.id },
    data: {
      status: "pending_review",
      submittedAt: new Date(),
      onboardingStep: 2,
    },
  });

  revalidatePath("/seller");
  revalidatePath("/admin/sellers");
  return { ok: true };
}
