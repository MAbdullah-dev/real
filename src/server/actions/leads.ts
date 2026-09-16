"use server";

import { updateTag } from "next/cache";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, retryMessage } from "@/lib/rate-limit";
import { recordPropertyLead } from "@/server/analytics";
import { hostPropertyScope } from "@/server/bookings";
import { requireAuth } from "@/server/auth";
import { createNotification } from "@/server/notifications";
import { hostEnquiriesHref } from "@/server/roles";

export type LeadActionResult = { ok?: true; id?: string; error?: string };

const MS_HOUR = 3_600_000;

const leadSchema = z.object({
  propertyId: z.string().min(1),
  name: z.string().trim().min(2, "Enter your full name.").max(80),
  email: z.string().trim().email("Enter a valid email.").max(160),
  phone: z.string().trim().max(32).optional().default(""),
  message: z
    .string()
    .trim()
    .min(8, "Tell the listing contact what you need.")
    .max(1500, "Keep it under 1500 characters."),
});

export async function createLeadAction(
  input: z.input<typeof leadSchema>
): Promise<LeadActionResult> {
  const parsed = leadSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  const values = parsed.data;
  const session = await auth();

  const limit = rateLimit(
    `enquiry:${session?.user?.id ?? values.email.toLowerCase()}`,
    5,
    MS_HOUR
  );
  if (!limit.ok) return { error: retryMessage(limit.retryAfterMs) };

  const property = await prisma.property.findUnique({
    where: { id: values.propertyId },
    select: { id: true, title: true, status: true, agentId: true, sellerId: true },
  });
  if (!property || property.status !== "published") {
    return { error: "That listing is no longer available." };
  }
  if (session?.user?.id && property.agentId === session.user.id) {
    return { error: "This is your own listing." };
  }

  const lead = await prisma.lead.create({
    data: {
      propertyId: property.id,
      userId: session?.user?.id ?? null,
      name: values.name,
      email: values.email,
      phone: values.phone || null,
      message: values.message,
      lastMessageAt: new Date(),
    },
    select: { id: true },
  });

  const hosts = await prisma.user.findMany({
    where: { id: { in: [...new Set([property.agentId, property.sellerId].filter(Boolean) as string[])] } },
    select: { id: true, role: true },
  });

  await Promise.all([
    recordPropertyLead(property.id),
    ...hosts.map((host) =>
      createNotification(
        host.id,
        "New enquiry",
        `${values.name} asked about ${property.title}.`,
        hostEnquiriesHref(host.role)
      )
    ),
  ]);

  updateTag("enquiries");
  return { ok: true, id: lead.id };
}

const replySchema = z.object({
  leadId: z.string().min(1),
  body: z.string().trim().min(1, "Write a message.").max(1500),
});

/** Both sides post into the same thread; the viewer's relation decides the side. */
export async function replyToLeadAction(
  input: z.input<typeof replySchema>
): Promise<LeadActionResult> {
  const session = await requireAuth();
  const parsed = replySchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Write a message." };
  }

  const limit = rateLimit(`reply:${session.user.id}`, 30, MS_HOUR);
  if (!limit.ok) return { error: retryMessage(limit.retryAfterMs) };

  const lead = await prisma.lead.findUnique({
    where: { id: parsed.data.leadId },
    select: {
      id: true,
      userId: true,
      name: true,
      property: {
        select: { id: true, title: true, agentId: true, sellerId: true, agencyId: true },
      },
    },
  });
  if (!lead) return { error: "That conversation no longer exists." };

  const fromBuyer = lead.userId === session.user.id;
  if (!fromBuyer) {
    const scope = await hostPropertyScope(session.user.id, session.user.role);
    const allowed =
      scope &&
      (await prisma.property.count({ where: { id: lead.property.id, ...scope } })) > 0;
    if (!allowed) return { error: "You are not part of this conversation." };
  }

  await prisma.$transaction([
    prisma.leadMessage.create({
      data: {
        leadId: lead.id,
        authorId: session.user.id,
        fromBuyer,
        body: parsed.data.body,
      },
    }),
    prisma.lead.update({
      where: { id: lead.id },
      data: { lastMessageAt: new Date(), status: fromBuyer ? "open" : "replied" },
    }),
  ]);

  if (fromBuyer) {
    const hosts = await prisma.user.findMany({
      where: {
        id: {
          in: [
            ...new Set(
              [lead.property.agentId, lead.property.sellerId].filter(Boolean) as string[]
            ),
          ],
        },
      },
      select: { id: true, role: true },
    });
    await Promise.all(
      hosts.map((host) =>
        createNotification(
          host.id,
          "New message",
          `${lead.name} replied about ${lead.property.title}.`,
          hostEnquiriesHref(host.role)
        )
      )
    );
  } else if (lead.userId) {
    await createNotification(
      lead.userId,
      "Reply received",
      `The listing contact replied about ${lead.property.title}.`,
      `/dashboard/messages/${lead.id}`
    );
  }

  updateTag("enquiries");
  return { ok: true };
}

const closeSchema = z.object({ leadId: z.string().min(1) });

export async function closeLeadAction(
  input: z.input<typeof closeSchema>
): Promise<LeadActionResult> {
  const session = await requireAuth();
  const parsed = closeSchema.safeParse(input);
  if (!parsed.success) return { error: "Unsupported change." };

  const scope = await hostPropertyScope(session.user.id, session.user.role);
  if (!scope) return { error: "Your account cannot manage enquiries." };

  const updated = await prisma.lead.updateMany({
    where: { id: parsed.data.leadId, property: scope },
    data: { status: "closed" },
  });
  if (updated.count === 0) return { error: "You are not part of this conversation." };

  updateTag("enquiries");
  return { ok: true };
}
