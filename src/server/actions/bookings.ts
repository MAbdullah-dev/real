"use server";

import { updateTag } from "next/cache";
import type { BookingStatus } from "@prisma/client";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { recordPropertyLead } from "@/server/analytics";
import { requireRole } from "@/server/auth";
import { createNotification } from "@/server/notifications";

const bookingSchema = z.object({
  propertyId: z.string().min(1),
  name: z.string().min(2, "Enter your full name."),
  email: z.string().email("Enter a valid email."),
  phone: z.string().min(6, "Enter a contact number."),
  requestedDates: z.string().min(3, "Share your preferred dates."),
  notes: z.string().min(6, "Add a little context for the agent."),
});

export type BookingActionResult = { ok?: true; error?: string };

export async function createBookingAction(
  input: z.input<typeof bookingSchema>
): Promise<BookingActionResult> {
  const parsed = bookingSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  const values = parsed.data;
  const property = await prisma.property.findUnique({
    where: { id: values.propertyId },
    select: { id: true, title: true, agentId: true, status: true },
  });
  if (!property || property.status !== "published") {
    return { error: "That listing is no longer accepting visits." };
  }

  const session = await auth();

  await prisma.booking.create({
    data: {
      propertyId: property.id,
      userId: session?.user?.id ?? null,
      name: values.name,
      email: values.email,
      phone: values.phone,
      requestedDates: values.requestedDates,
      notes: values.notes,
    },
  });

  await Promise.all([
    recordPropertyLead(property.id),
    createNotification(
      property.agentId,
      "New visit request",
      `${values.name} asked to view ${property.title} (${values.requestedDates}).`
    ),
  ]);

  updateTag("bookings");
  return { ok: true };
}

const statusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["pending", "confirmed", "declined", "completed"]),
  visitDate: z.string().optional(),
});

export async function updateBookingStatusAction(
  input: z.input<typeof statusSchema>
): Promise<BookingActionResult> {
  const session = await requireRole(["AGENT", "ADMIN"]);
  const parsed = statusSchema.safeParse(input);
  if (!parsed.success) return { error: "Unsupported status change." };

  const booking = await prisma.booking.findUnique({
    where: { id: parsed.data.id },
    include: { property: { select: { title: true, agentId: true } } },
  });
  if (!booking) return { error: "That request no longer exists." };

  if (session.user.role !== "ADMIN" && booking.property.agentId !== session.user.id) {
    return { error: "You can only manage requests for your own listings." };
  }

  const visitDate = parsed.data.visitDate ? new Date(parsed.data.visitDate) : undefined;

  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: parsed.data.status as BookingStatus,
      ...(visitDate && !Number.isNaN(visitDate.valueOf()) ? { visitDate } : {}),
    },
  });

  if (booking.userId) {
    const copy: Record<BookingStatus, string> = {
      pending: "is back in the queue",
      confirmed: "was confirmed",
      declined: "was declined",
      completed: "was marked complete",
    };
    await createNotification(
      booking.userId,
      "Visit request updated",
      `Your request for ${booking.property.title} ${copy[parsed.data.status]}.`
    );
  }

  updateTag("bookings");
  return { ok: true };
}
