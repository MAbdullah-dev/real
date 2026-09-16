"use client";

import {
  CalendarClock,
  Loader2,
  MessageSquare,
  Phone,
  ShieldCheck,
  Share2,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import * as React from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  CONTACT_KIND_BLURBS,
  CONTACT_KIND_LABELS,
  telHref,
  whatsappHref,
} from "@/lib/listing-contact";
import { formatPrice } from "@/lib/utils";
import { createLeadAction } from "@/server/actions/leads";
import type { Property } from "@/types";

export function PropertyStickyPanel({ property }: { property: Property }) {
  const { contact } = property;
  const priceLabel =
    property.purpose === "rent"
      ? `${formatPrice(property.price)}/mo`
      : formatPrice(property.price);

  return (
    <div className="space-y-6 lg:sticky lg:top-24">
      <Card className="rounded-3xl border-border/80 shadow-[var(--shadow-soft)]">
        <CardContent className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {property.purpose === "rent" ? "Monthly lease" : "Asking price"}
              </p>
              <p className="mt-2 text-3xl font-semibold tabular-nums">{priceLabel}</p>
            </div>
            <ShareButton title={property.title} />
          </div>

          <Separator className="my-6" />

          <ContactIdentity property={property} />

          <div className="mt-6 space-y-3">
            <Button asChild className="w-full rounded-full">
              <Link href={`/booking/${property.id}`}>
                <CalendarClock className="mr-2 h-4 w-4" aria-hidden />
                Request a viewing
              </Link>
            </Button>
            <div className="grid gap-3 sm:grid-cols-2">
              {contact.phone ? (
                <Button asChild variant="outline" className="rounded-full">
                  <a href={telHref(contact.phone)}>
                    <Phone className="mr-2 h-4 w-4" aria-hidden />
                    Call
                  </a>
                </Button>
              ) : null}
              <Button
                type="button"
                variant="outline"
                className={contact.phone ? "rounded-full" : "rounded-full sm:col-span-2"}
                onClick={() =>
                  document
                    .getElementById("enquiry")
                    ?.scrollIntoView({ behavior: "smooth", block: "center" })
                }
              >
                <MessageSquare className="mr-2 h-4 w-4" aria-hidden />
                Ask a question
              </Button>
            </div>
            {contact.whatsapp ? (
              <a
                href={whatsappHref(contact.whatsapp)}
                target="_blank"
                rel="noreferrer noopener"
                className="block text-center text-xs font-medium text-primary hover:underline"
              >
                Message on WhatsApp
              </a>
            ) : null}
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            A viewing is confirmed by a person, not booked instantly — you will be notified
            as soon as they reply.
          </p>
        </CardContent>
      </Card>

      <EnquiryCard property={property} />
    </div>
  );
}

function ContactIdentity({ property }: { property: Property }) {
  const { contact } = property;
  const body = (
    <>
      <Avatar className="h-12 w-12">
        <AvatarImage src={contact.avatar} alt="" />
        <AvatarFallback>{contact.name.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {CONTACT_KIND_LABELS[contact.kind]}
        </p>
        <p className="truncate text-sm font-semibold">{contact.name}</p>
        <p className="truncate text-xs text-muted-foreground">{contact.org}</p>
      </div>
    </>
  );

  return (
    <div>
      {contact.profileHref ? (
        <Link
          href={contact.profileHref}
          className="flex items-center gap-3 rounded-2xl transition-opacity hover:opacity-80"
        >
          {body}
        </Link>
      ) : (
        <div className="flex items-center gap-3">{body}</div>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {contact.verified ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden />
            Verified {CONTACT_KIND_LABELS[contact.kind].toLowerCase()}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
            Verification pending
          </span>
        )}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        {CONTACT_KIND_BLURBS[contact.kind]}
      </p>
    </div>
  );
}

function ShareButton({ title }: { title: string }) {
  return (
    <Button
      type="button"
      size="icon"
      variant="outline"
      className="shrink-0 rounded-full"
      aria-label="Share this listing"
      onClick={async () => {
        const url = window.location.href;
        try {
          if (navigator.share) {
            await navigator.share({ title, url });
            return;
          }
          await navigator.clipboard.writeText(url);
          toast.success("Link copied");
        } catch {
          // A dismissed share sheet or a denied clipboard is not an error worth shouting about.
        }
      }}
    >
      <Share2 className="h-4 w-4" aria-hidden />
    </Button>
  );
}

function EnquiryCard({ property }: { property: Property }) {
  const { data: session, status } = useSession();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [sentId, setSentId] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  // Prefill once the session resolves; the buyer can still edit the values.
  const [prefilled, setPrefilled] = React.useState(false);
  if (status === "authenticated" && !prefilled) {
    setPrefilled(true);
    setName(session?.user?.name ?? "");
    setEmail(session?.user?.email ?? "");
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await createLeadAction({
        propertyId: property.id,
        name,
        email,
        phone,
        message,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setSentId(result.id ?? "");
      setMessage("");
      toast.success("Question sent");
    });
  }

  return (
    <Card id="enquiry" className="scroll-mt-24 rounded-3xl border-border/80">
      <CardContent className="p-6 sm:p-8">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <MessageSquare className="h-4 w-4 text-primary" aria-hidden />
          Ask about this property
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Questions about price, service charge, documents, or the neighbourhood — no date
          needed. To arrange a visit, use <strong>Request a viewing</strong> above.
        </p>

        {sentId ? (
          <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm">
            <p className="font-medium">Your question is on its way.</p>
            <p className="mt-1 text-muted-foreground">
              {session?.user
                ? "Replies land in your messages and as a notification."
                : "They will reply to the email you gave. Sign in next time to keep the whole conversation in one thread."}
            </p>
            {session?.user && sentId ? (
              <Link
                href={`/dashboard/messages/${sentId}`}
                className="mt-3 inline-block font-medium text-primary hover:underline"
              >
                Open conversation →
              </Link>
            ) : null}
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={submit}>
            <div className="space-y-2">
              <Label htmlFor="enquiry-name">Full name</Label>
              <Input
                id="enquiry-name"
                required
                minLength={2}
                maxLength={80}
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={pending}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="enquiry-email">Email</Label>
                <Input
                  id="enquiry-email"
                  type="email"
                  required
                  maxLength={160}
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={pending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="enquiry-phone">Phone (optional)</Label>
                <Input
                  id="enquiry-phone"
                  type="tel"
                  maxLength={32}
                  autoComplete="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  disabled={pending}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="enquiry-message">Your question</Label>
              <Textarea
                id="enquiry-message"
                rows={4}
                required
                minLength={8}
                maxLength={1500}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                disabled={pending}
              />
            </div>
            <Button type="submit" className="w-full rounded-full" disabled={pending}>
              {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
              Send question
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
