import { Card, CardContent } from "@/components/ui/card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "Estate Elite pairs luxury inventory with human-confirmed visits and agent subscriptions.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-semibold tracking-tight">Built for serious real estate</h1>
      <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
        Estate Elite is a marketplace architecture that treats every viewing like a hospitality moment — precise
        timing, verified agents, and media that actually sells the volume of a space.
      </p>
      <div className="mt-12 grid gap-6">
        {[
          {
            title: "Operations-first booking",
            body: "We manually confirm visits to protect both buyers and listing desks — reducing no-shows and friction.",
          },
          {
            title: "Subscription-native agents",
            body: "Listing caps align incentives: quality media, accurate availability, and measurable performance.",
          },
          {
            title: "Enterprise roadmap",
            body: "SSO, audit trails, and API exports are first-class for institutional partners and developer teams.",
          },
        ].map((x) => (
          <Card key={x.title} className="rounded-3xl">
            <CardContent className="p-8">
              <h2 className="font-semibold">{x.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{x.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
