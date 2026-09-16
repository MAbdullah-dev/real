import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function ForBrokersPage() {
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
            Work as an independent broker
          </h1>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Connect buyers and sellers, arrange visits, and guide the deal — your own pipeline, not an
            agency account.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="rounded-full">
              <Link href="/auth/register/broker">Become a broker</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full">
              <Link href="/auth/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </section>
      <section className="border-t border-border/60 px-[var(--section-x)] py-12">
        <p className="mx-auto max-w-3xl text-center text-sm text-muted-foreground">
          Representing a firm?{" "}
          <Link href="/for-agencies" className="font-medium text-foreground underline">
            Agency signup
          </Link>
        </p>
      </section>
    </div>
  );
}
