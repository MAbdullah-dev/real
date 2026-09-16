"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createAgencyForUser, getMembership, agencyConsoleAccess } from "@/server/agency";
import { isSettingEnabled } from "@/server/admin";
import {
  createBrokerProfileForUser,
  getBrokerProfile,
  brokerConsoleAccess,
} from "@/server/broker";
import {
  createSellerProfileForUser,
  getSellerProfile,
  sellerConsoleAccess,
} from "@/server/seller";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const registerSchema = credentialsSchema.extend({
  name: z.string().trim().min(2, "Enter your full name.").max(80),
  password: z.string().min(8, "Use at least 8 characters.").max(72),
  phone: z.string().min(6).optional(),
  asBroker: z.boolean().optional(),
  asAgency: z.boolean().optional(),
  asSeller: z.boolean().optional(),
  acceptTerms: z.boolean().optional(),
});

async function destinationForUser(userId: string, role: string) {
  if (role === "ADMIN") return "/admin";
  if (role === "AGENCY") {
    const membership = await getMembership(userId);
    const access = agencyConsoleAccess(membership?.agency.status);
    if (access === "onboarding") return "/auth/onboarding/agency";
    return "/agency";
  }
  if (role === "BROKER") {
    const profile = await getBrokerProfile(userId);
    const access = brokerConsoleAccess(profile?.status);
    if (access === "onboarding") return "/auth/onboarding/broker";
    return "/broker";
  }
  if (role === "SELLER") {
    const profile = await getSellerProfile(userId);
    const access = sellerConsoleAccess(profile?.status);
    if (access === "onboarding") return "/auth/onboarding/seller";
    return "/seller";
  }
  return "/dashboard";
}

function safeCallback(url?: string | null) {
  if (!url || !url.startsWith("/")) return null;
  if (url.startsWith("//")) return null;
  return url;
}

export async function loginAction(input: {
  email: string;
  password: string;
  callbackUrl?: string;
}): Promise<{ error?: string }> {
  const parsed = credentialsSchema.safeParse(input);
  if (!parsed.success) return { error: "Enter a valid email and password." };

  const email = parsed.data.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.passwordHash) return { error: "Invalid email or password." };

  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) return { error: "Invalid email or password." };

  const dest = safeCallback(input.callbackUrl) ?? (await destinationForUser(user.id, user.role));

  try {
    await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirectTo: dest,
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw error;
  }
}

export async function registerAction(input: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  asBroker?: boolean;
  asAgency?: boolean;
  asSeller?: boolean;
  acceptTerms?: boolean;
  callbackUrl?: string;
}): Promise<{ error?: string }> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check your details." };
  }

  const asBroker = Boolean(parsed.data.asBroker);
  const asAgency = Boolean(parsed.data.asAgency);
  const asSeller = Boolean(parsed.data.asSeller);
  const picked = [asBroker, asAgency, asSeller].filter(Boolean).length;
  if (picked > 1) {
    return { error: "Choose only one account type." };
  }

  if (asBroker) {
    if (!(await isSettingEnabled("allowBrokerSignup"))) {
      return { error: "Broker signup is temporarily closed. Contact support." };
    }
    if (!parsed.data.phone?.trim()) {
      return { error: "Enter a phone number so clients can reach you." };
    }
    if (!parsed.data.acceptTerms) {
      return { error: "Accept the terms to continue." };
    }
  }

  if (asAgency) {
    if (!(await isSettingEnabled("allowAgencySignup"))) {
      return { error: "Agency signup is temporarily closed. Contact support." };
    }
    if (!parsed.data.phone?.trim()) {
      return { error: "Enter a phone number so buyers can reach your agency." };
    }
    if (!parsed.data.acceptTerms) {
      return { error: "Accept the terms and agency agreement to continue." };
    }
  }

  if (asSeller) {
    if (!(await isSettingEnabled("allowSellerSignup"))) {
      return { error: "Seller signup is temporarily closed. Contact support." };
    }
    if (!parsed.data.phone?.trim()) {
      return { error: "Enter a phone number so buyers can reach you." };
    }
    if (!parsed.data.acceptTerms) {
      return { error: "Accept the terms to continue." };
    }
  }

  const email = parsed.data.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with that email already exists." };

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const role = asAgency ? "AGENCY" : asBroker ? "BROKER" : asSeller ? "SELLER" : "USER";

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name.trim(),
      email,
      passwordHash,
      role,
      emailVerified: new Date(),
    },
  });

  if (asAgency) {
    await createAgencyForUser(user.id, {
      phone: parsed.data.phone!.trim(),
      name: parsed.data.name.trim(),
      type: "agency",
    });
  }

  if (asBroker) {
    await createBrokerProfileForUser(user.id, {
      phone: parsed.data.phone!.trim(),
      name: parsed.data.name.trim(),
    });
  }

  if (asSeller) {
    await createSellerProfileForUser(user.id, {
      phone: parsed.data.phone!.trim(),
    });
  }

  const redirectTo = asAgency
    ? "/auth/onboarding/agency"
    : asBroker
      ? "/auth/onboarding/broker"
      : asSeller
        ? "/auth/onboarding/seller"
        : // A buyer who started from a listing should land back on it.
          (safeCallback(input.callbackUrl) ?? "/dashboard");

  try {
    await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirectTo,
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Account created, but sign-in failed. Please log in." };
    }
    throw error;
  }
}

export async function googleSignIn(callbackUrl?: string) {
  await signIn("google", { redirectTo: safeCallback(callbackUrl) ?? "/dashboard" });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
