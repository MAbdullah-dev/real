import { CalendarRange, LogIn, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { RequestViewingForm } from "@/components/viewings/request-viewing-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CONTACT_KIND_BLURBS, CONTACT_KIND_LABELS } from "@/lib/listing-contact";
import { formatPrice } from "@/lib/utils";
import { getSession } from "@/server/auth";
import { getPropertyById } from "@/server/properties";
import type { Property } from "@/types";

export const metadata = { title: "Request a viewing" };

export default function RequestViewingPage({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium">
        <CalendarRange className="h-3.5 w-3.5" aria-hidden />
        Request a time — the listing contact confirms it
      </div>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight sm:text-3xl">
        Request a viewing
      </h1>
      {/* Everything below depends on the route param, which streams in. */}
      <Suspense fallback={<RequestViewingFallback />}>
        <ViewingRequest params={params} />
      </Suspense>
    </div>
  );
}

async function ViewingRequest({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  const { propertyId } = await params;
  const property = await getPropertyById(propertyId);
  if (!property) notFound();

  const { contact } = property;
  const priceLabel =
    property.purpose === "rent"
      ? `${formatPrice(property.price)}/mo`
      : formatPrice(property.price);

  return (
    <>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        {CONTACT_KIND_BLURBS[contact.kind]} Offer up to three windows that suit you; you will
        get a notification as soon as they reply, and you can reschedule or cancel any time.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_minmax(0,340px)] lg:items-start">
        <Card className="rounded-3xl">
          <CardContent className="p-6 sm:p-8">
            {/* The session is uncached, so it gets its own boundary. */}
            <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
              <RequestPanel property={property} />
            </Suspense>
          </CardContent>
        </Card>

        <Card className="rounded-3xl lg:sticky lg:top-24">
          <CardContent className="p-5">
            <Link href={`/properties/${property.slug}`} className="group block">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                <Image
                  src={property.image}
                  alt={property.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  sizes="(max-width: 1024px) 100vw, 340px"
                />
              </div>
              <p className="mt-4 font-semibold leading-snug group-hover:text-primary">
                {property.title}
              </p>
            </Link>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {property.city}, {property.country}
            </p>
            <p className="mt-3 text-lg font-semibold tabular-nums">{priceLabel}</p>
            <div className="mt-4 rounded-2xl bg-muted/40 p-4 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {CONTACT_KIND_LABELS[contact.kind]}
              </p>
              <p className="mt-1 font-medium">{contact.name}</p>
              <p className="text-xs text-muted-foreground">{contact.org}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

async function RequestPanel({ property }: { property: Property }) {
  const session = await getSession();
  const target = `/booking/${property.id}`;

  if (session?.user) {
    return (
      <RequestViewingForm
        propertyId={property.id}
        propertySlug={property.slug}
        contactKind={property.contact.kind}
      />
    );
  }

  return (
    <div className="flex flex-col items-start gap-4">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <LogIn className="h-6 w-6" aria-hidden />
      </span>
      <div>
        <h2 className="text-lg font-semibold">Sign in to book a viewing</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          An account lets you track the request, accept a new time if the listing contact
          offers one, and reschedule or cancel without a phone call.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button asChild className="rounded-full">
          <Link href={`/auth/login?callbackUrl=${encodeURIComponent(target)}`}>Sign in</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-full">
          <Link href={`/auth/register?callbackUrl=${encodeURIComponent(target)}`}>
            Create an account
          </Link>
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Prefer not to sign up?{" "}
        <Link
          href={`/properties/${property.slug}#enquiry`}
          className="font-medium text-primary hover:underline"
        >
          Ask a question about this listing
        </Link>{" "}
        instead.
      </p>
    </div>
  );
}

function RequestViewingFallback() {
  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_minmax(0,340px)]">
      <Skeleton className="h-[34rem] w-full rounded-3xl" />
      <Skeleton className="h-80 w-full rounded-3xl" />
    </div>
  );
}
