import { ArrowLeft, CalendarClock } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EnquiryThread } from "@/components/enquiries/enquiry-thread";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/server/auth";

export const metadata = { title: "Conversation" };

export default async function BuyerThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireAuth();

  const thread = await prisma.lead.findFirst({
    where: { id, userId: session.user.id },
    include: {
      property: { select: { id: true, slug: true, title: true, city: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!thread) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/messages"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        All messages
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            <Link href={`/properties/${thread.property.slug}`} className="hover:underline">
              {thread.property.title}
            </Link>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{thread.property.city}</p>
        </div>
        <Button asChild variant="outline" className="rounded-full">
          <Link href={`/booking/${thread.property.id}`}>
            <CalendarClock className="mr-2 h-4 w-4" aria-hidden />
            Request a viewing
          </Link>
        </Button>
      </div>

      <Card className="rounded-3xl">
        <CardContent className="p-6">
          <EnquiryThread
            leadId={thread.id}
            viewer="buyer"
            canReply
            closed={thread.status === "closed"}
            turns={[
              {
                id: thread.id,
                fromBuyer: true,
                body: thread.message,
                createdAt: thread.createdAt,
              },
              ...thread.messages,
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
