"use server";

import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { rateLimit, retryMessage } from "@/lib/rate-limit";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(80),
  email: z.string().trim().email("Enter a valid email.").max(160),
  company: z.string().trim().max(120).optional(),
  message: z.string().trim().min(10, "Tell us a little more.").max(2000),
});

export type ContactActionResult = { ok?: true; error?: string };

export async function sendContactMessageAction(
  input: z.input<typeof contactSchema>
): Promise<ContactActionResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  const limit = rateLimit(`contact:${parsed.data.email.toLowerCase()}`, 3, 3_600_000);
  if (!limit.ok) return { error: retryMessage(limit.retryAfterMs) };

  await prisma.contactMessage.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      company: parsed.data.company?.trim() || null,
      message: parsed.data.message,
    },
  });

  return { ok: true };
}
