"use server";

import { z } from "zod";

import { prisma } from "@/lib/prisma";

const contactSchema = z.object({
  name: z.string().min(2, "Enter your name."),
  email: z.string().email("Enter a valid email."),
  company: z.string().optional(),
  message: z.string().min(10, "Tell us a little more."),
});

export type ContactActionResult = { ok?: true; error?: string };

export async function sendContactMessageAction(
  input: z.input<typeof contactSchema>
): Promise<ContactActionResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

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
