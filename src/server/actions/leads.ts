"use server";

import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { recordPropertyLead } from "@/server/analytics";
import { createNotification } from "@/server/notifications";

const leadSchema = z.object({
  propertyId: z.string().min(1),
  name: z.string().min(2, "Enter your full name."),
  email: z.string().email("Enter a valid email."),
  phone: z.string().min(6, "Enter a contact number.").optional().or(z.literal("")),
  message: z.string().min(8, "Tell the agent what you need."),
});

export type LeadActionResult = { ok?: true; error?: string };

export async function createLeadAction(
  input: z.input<typeof leadSchema>
): Promise<LeadActionResult> {
  const parsed = leadSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  const values = parsed.data;
  const property = await prisma.property.findUnique({
    where: { id: values.propertyId },
    select: { id: true, title: true, agentId: true, status: true },
  });
  if (!property || property.status !== "published") {
    return { error: "That listing is no longer available." };
  }

  const session = await auth();

  await prisma.lead.create({
    data: {
      propertyId: property.id,
      userId: session?.user?.id ?? null,
      name: values.name,
      email: values.email,
      phone: values.phone || null,
      message: values.message,
    },
  });

  await Promise.all([
    recordPropertyLead(property.id),
    createNotification(
      property.agentId,
      "New enquiry",
      `${values.name} enquired about ${property.title}.`
    ),
  ]);

  return { ok: true };
}
