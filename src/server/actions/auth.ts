"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const registerSchema = credentialsSchema.extend({
  name: z.string().min(2),
  asAgent: z.boolean().optional(),
});

function destinationForRole(role: string) {
  if (role === "ADMIN") return "/admin";
  if (role === "AGENT") return "/agent";
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

  const dest = safeCallback(input.callbackUrl) ?? destinationForRole(user.role);

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
  asAgent?: boolean;
}): Promise<{ error?: string }> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return { error: "Please check your details and try again." };

  const email = parsed.data.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with that email already exists." };

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const role = parsed.data.asAgent ? "AGENT" : "USER";

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name.trim(),
      email,
      passwordHash,
      role,
    },
  });

  if (role === "AGENT") {
    await prisma.agentProfile.create({
      data: { userId: user.id },
    });
  }

  try {
    await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirectTo: role === "AGENT" ? "/auth/onboarding/agent" : "/dashboard",
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
