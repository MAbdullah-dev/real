import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function ForSellersPage() {
  return (
    <div className="bg-[radial-gradient(circle_at_top,_rgba(15,76,58,0.12),_transparent_45%)]">
      <section className="relative overflow-hidden px-[var(--section-x)] pb-16 pt-16 sm:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <p
            className="text-5xl tracking-tight text-primary sm:text-6xl"
            style={{ fontFamily: "var(--font-display), serif" }}
          >
            Estate Elite
          </p>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Sell your property without an agency
          </h1>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Owners list directly, manage visit requests, and stay in control — with a short
            verification review before anything goes live.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="rounded-full">
              <Link href="/auth/register/seller">List as a seller</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full">
              <Link href="/auth/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 bg-background/70 px-[var(--section-x)] py-16">
        <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-3">
          {[
            {
              title: "You own the listing",
              body: "No brokerage markup required. Buyers reach you through the platform.",
            },
            {
              title: "Verified before publish",
              body: "Submit a short profile. Listings go live after admin approval.",
            },
            {
              title: "3 free listing slots",
              body: "Keep up to three active listings as a verified seller.",
            },
          ].map((item) => (
            <div key={item.title}>
              <h2 className="text-lg font-semibold tracking-tight">{item.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-12 max-w-5xl rounded-3xl border border-border bg-card/80 p-6">
          <p className="text-sm text-muted-foreground">
            Looking to represent clients professionally?{" "}
            <Link href="/for-agencies" className="font-medium text-foreground underline">
              Join as an agency
            </Link>{" "}
            or{" "}
            <Link href="/for-brokers" className="font-medium text-foreground underline">
              as a broker
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
