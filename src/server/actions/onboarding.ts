"use server";

import type { AgencyType, CredentialType } from "@prisma/client";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import {
  requireAgency,
  requiredCredentialTypes,
} from "@/server/agency";
import { getActiveSubscriptionForAgency } from "@/server/subscriptions";

export type OnboardingResult = { ok?: true; error?: string; nextStep?: number };

const identitySchema = z.object({
  type: z.enum(["individual", "agency", "developer"]),
  name: z.string().min(2, "Enter your trading / agency name."),
  country: z.string().min(2, "Select a country."),
  city: z.string().min(2, "Enter your city."),
  markets: z.array(z.string().min(1)).min(1, "Pick at least one market."),
  title: z.string().optional(),
});

export async function saveOnboardingIdentityAction(
  input: z.input<typeof identitySchema>
): Promise<OnboardingResult> {
  const { agency, membership } = await requireAgency();
  if (!agency) return { error: "No agency found." };
  if (agency.status === "active" || agency.status === "suspended") {
    return { error: "This agency can no longer edit onboarding." };
  }

  const parsed = identitySchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  if (parsed.data.type !== "individual" && parsed.data.name.trim().length < 2) {
    return { error: "Agency / developer name is required." };
  }

  await prisma.$transaction([
    prisma.agency.update({
      where: { id: agency.id },
      data: {
        type: parsed.data.type as AgencyType,
        name: parsed.data.name.trim(),
        country: parsed.data.country.trim().toUpperCase(),
        city: parsed.data.city.trim(),
        markets: parsed.data.markets.map((m) => m.trim()).filter(Boolean),
        onboardingStep: Math.max(agency.onboardingStep, 1),
        status: agency.status === "rejected" ? "onboarding" : agency.status,
      },
    }),
    prisma.agencyMember.update({
      where: { id: membership!.id },
      data: { title: parsed.data.title?.trim() || null },
    }),
  ]);

  revalidatePath("/auth/onboarding/agency");
  return { ok: true, nextStep: 1 };
}

const credentialItemSchema = z.object({
  type: z.enum([
    "national_id",
    "tax_number",
    "business_registration",
    "real_estate_license",
    "office_proof",
    "other",
  ]),
  value: z.string().optional(),
  authority: z.string().optional(),
  jurisdiction: z.string().optional(),
  expiresAt: z.string().optional(),
  fileUrl: z.string().url().optional().or(z.literal("")),
});

export async function saveOnboardingCredentialsAction(
  items: z.input<typeof credentialItemSchema>[]
): Promise<OnboardingResult> {
  const { agency, session } = await requireAgency();
  if (!agency) return { error: "No agency found." };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { emailVerified: true },
  });
  if (!user?.emailVerified && session.user.role !== "ADMIN") {
    return { error: "Verify your email before submitting credentials." };
  }

  const parsed = z.array(credentialItemSchema).safeParse(items);
  if (!parsed.success) return { error: "Check your credential details." };

  const required = requiredCredentialTypes(agency.country, agency.type);
  for (const type of required) {
    const row = parsed.data.find((item) => item.type === type);
    if (!row?.value?.trim() && !row?.fileUrl) {
      return { error: `Add your ${type.replaceAll("_", " ")} details or document.` };
    }
  }

  await prisma.$transaction(async (tx) => {
    for (const item of parsed.data) {
      if (!item.value?.trim() && !item.fileUrl) continue;
      await tx.agentCredential.upsert({
        where: { agencyId_type: { agencyId: agency.id, type: item.type as CredentialType } },
        update: {
          value: item.value?.trim() || null,
          authority: item.authority?.trim() || null,
          jurisdiction: item.jurisdiction?.trim() || null,
          expiresAt: item.expiresAt ? new Date(item.expiresAt) : null,
          fileUrl: item.fileUrl || null,
          status: "pending",
          reviewNote: null,
        },
        create: {
          agencyId: agency.id,
          type: item.type as CredentialType,
          value: item.value?.trim() || null,
          authority: item.authority?.trim() || null,
          jurisdiction: item.jurisdiction?.trim() || null,
          expiresAt: item.expiresAt ? new Date(item.expiresAt) : null,
          fileUrl: item.fileUrl || null,
        },
      });
    }

    await tx.agency.update({
      where: { id: agency.id },
      data: { onboardingStep: Math.max(agency.onboardingStep, 2) },
    });
  });

  revalidatePath("/auth/onboarding/agency");
  return { ok: true, nextStep: 2 };
}

const profileSchema = z.object({
  bio: z.string().min(40, "Write a short public bio (40+ characters)."),
  image: z.string().url("Upload a profile photo.").optional().or(z.literal("")),
  languages: z.array(z.string()).optional(),
  specialties: z.array(z.string()).optional(),
  whatsapp: z.string().optional(),
});

export async function saveOnboardingProfileAction(
  input: z.input<typeof profileSchema>
): Promise<OnboardingResult> {
  const { agency, membership, session } = await requireAgency();
  if (!agency || !membership) return { error: "No agency found." };

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  if (!parsed.data.image && !session.user.image) {
    return { error: "Upload a profile photo — buyers convert better with a face." };
  }

  await prisma.$transaction([
    prisma.agency.update({
      where: { id: agency.id },
      data: {
        bio: parsed.data.bio.trim(),
        onboardingStep: Math.max(agency.onboardingStep, 3),
      },
    }),
    prisma.agencyMember.update({
      where: { id: membership.id },
      data: {
        languages: parsed.data.languages ?? [],
        specialties: parsed.data.specialties ?? [],
        whatsapp: parsed.data.whatsapp?.trim() || null,
      },
    }),
    ...(parsed.data.image
      ? [
          prisma.user.update({
            where: { id: session.user.id },
            data: { image: parsed.data.image },
          }),
        ]
      : []),
  ]);

  updateTag(`agent-${session.user.id}`);
  revalidatePath("/auth/onboarding/agency");
  return { ok: true, nextStep: 3 };
}

export async function acceptStandardsAction(): Promise<OnboardingResult> {
  const { agency } = await requireAgency();
  if (!agency) return { error: "No agency found." };

  await prisma.agency.update({
    where: { id: agency.id },
    data: {
      standardsAcceptedAt: new Date(),
      onboardingStep: Math.max(agency.onboardingStep, 4),
    },
  });

  revalidatePath("/auth/onboarding/agency");
  return { ok: true, nextStep: 4 };
}

export async function submitAgencyForReviewAction(): Promise<OnboardingResult> {
  const { agency, session } = await requireAgency();
  if (!agency) return { error: "No agency found." };

  if (agency.onboardingStep < 4 || !agency.standardsAcceptedAt) {
    return { error: "Finish every onboarding step before submitting." };
  }
  if (!agency.country || !agency.city || !agency.name) {
    return { error: "Complete your business identity first." };
  }
  if (!agency.bio) return { error: "Add a public bio first." };

  const required = requiredCredentialTypes(agency.country, agency.type);
  const credentials = await prisma.agentCredential.findMany({
    where: { agencyId: agency.id },
  });
  for (const type of required) {
    const row = credentials.find((c) => c.type === type);
    if (!row || (!row.value && !row.fileUrl)) {
      return { error: `Missing required credential: ${type.replaceAll("_", " ")}.` };
    }
  }

  // Plan is encouraged but not hard-blocked — free tier exists.
  await getActiveSubscriptionForAgency(agency.id);

  await prisma.agency.update({
    where: { id: agency.id },
    data: {
      status: "pending_review",
      submittedAt: new Date(),
      statusNote: null,
      onboardingStep: 5,
    },
  });

  updateTag("agents");
  updateTag(`agent-${session.user.id}`);
  revalidatePath("/auth/onboarding/agency");
  revalidatePath("/admin/agencies");
  revalidatePath("/agency");
  return { ok: true, nextStep: 5 };
}
