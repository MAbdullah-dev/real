"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireBroker } from "@/server/broker";

export type BrokerOnboardingResult = { error?: string; ok?: true };

const profileSchema = z.object({
  phone: z.string().min(6, "Enter a reachable phone number."),
  country: z.string().min(2).max(2),
  city: z.string().min(2, "Enter your city."),
  title: z.string().max(80).optional(),
  bio: z.string().max(2000).optional(),
  whatsapp: z.string().max(40).optional(),
});

export async function saveBrokerProfileAction(
  input: z.input<typeof profileSchema>
): Promise<BrokerOnboardingResult> {
  const { session, profile } = await requireBroker();
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details." };
  }

  await prisma.brokerProfile.update({
    where: { userId: session.user.id },
    data: {
      phone: parsed.data.phone.trim(),
      country: parsed.data.country.toUpperCase(),
      city: parsed.data.city.trim(),
      title: parsed.data.title?.trim() || null,
      bio: parsed.data.bio?.trim() || null,
      whatsapp: parsed.data.whatsapp?.trim() || null,
      onboardingStep: Math.max(profile?.onboardingStep ?? 0, 1),
    },
  });

  revalidatePath("/broker");
  revalidatePath("/auth/onboarding/broker");
  return { ok: true };
}

export async function submitBrokerForReviewAction(): Promise<BrokerOnboardingResult> {
  const { session, profile, isAdmin } = await requireBroker();
  if (isAdmin) return { ok: true };

  if (!profile?.phone || !profile.country || !profile.city) {
    return { error: "Complete your profile before submitting." };
  }

  await prisma.brokerProfile.update({
    where: { userId: session.user.id },
    data: {
      status: "pending_review",
      submittedAt: new Date(),
      onboardingStep: 2,
    },
  });

  revalidatePath("/broker");
  revalidatePath("/admin/brokers");
  return { ok: true };
}
