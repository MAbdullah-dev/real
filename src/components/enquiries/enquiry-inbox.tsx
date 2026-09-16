import { Mail, MessageSquare, Phone } from "lucide-react";
import Link from "next/link";

import { EnquiryThread } from "@/components/enquiries/enquiry-thread";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Separator } from "@/components/ui/separator";
import { telHref } from "@/lib/listing-contact";
import { requireAuth } from "@/server/auth";
import { listHostEnquiries } from "@/server/bookings";

/** One enquiry inbox shared by the seller, broker, and agency consoles. */
export async function EnquiryInbox() {
  const session = await requireAuth();
  const enquiries = await listHostEnquiries(session.user.id, session.user.role);

  if (enquiries.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No enquiries yet"
        description="Questions buyers ask on your listings arrive here. Answer in the thread and they get a notification."
      />
    );
  }

  return (
    <div className="space-y-3">
      {enquiries.map((enquiry) => (
        <Card key={enquiry.id} className="rounded-3xl">
          <CardContent className="space-y-4 p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <Link
                  href={`/properties/${enquiry.property.slug}`}
                  className="font-medium hover:underline"
                >
                  {enquiry.property.title}
                </Link>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  <span className="font-medium">{enquiry.name}</span>
                  <a
                    href={`mailto:${enquiry.email}`}
                    className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <Mail className="h-3.5 w-3.5" aria-hidden />
                    {enquiry.email}
                  </a>
                  {enquiry.phone ? (
                    <a
                      href={telHref(enquiry.phone)}
                      className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                    >
                      <Phone className="h-3.5 w-3.5" aria-hidden />
                      {enquiry.phone}
                    </a>
                  ) : null}
                </div>
              </div>
              <Badge variant={enquiry.status === "open" ? "secondary" : "outline"}>
                {enquiry.status === "open"
                  ? "Awaiting reply"
                  : enquiry.status === "replied"
                    ? "Replied"
                    : "Closed"}
              </Badge>
            </div>

            <Separator />

            <EnquiryThread
              leadId={enquiry.id}
              viewer="host"
              canReply={Boolean(enquiry.userId)}
              closed={enquiry.status === "closed"}
              turns={[
                {
                  id: enquiry.id,
                  fromBuyer: true,
                  body: enquiry.message,
                  createdAt: enquiry.createdAt,
                },
                ...enquiry.messages,
              ]}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
