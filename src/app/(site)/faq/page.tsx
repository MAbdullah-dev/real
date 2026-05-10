import { Card, CardContent } from "@/components/ui/card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ",
};

const items = [
  {
    q: "How do visit requests work?",
    a: "Submit a window that suits you. Our operations desk confirms by phone, aligns with the listing agent, and sends a structured itinerary.",
  },
  {
    q: "Can I list commercial assets?",
    a: "Yes — offices, retail, and mixed-use use the same media standards with additional diligence fields.",
  },
  {
    q: "Do you integrate with our CRM?",
    a: "Enterprise plans include webhooks and batch exports; native Salesforce and HubSpot connectors are on the roadmap.",
  },
  {
    q: "Is there a mobile app?",
    a: "The web experience is mobile-first; native apps are planned once AR/360 consumption crosses threshold.",
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-semibold tracking-tight">Frequently asked</h1>
      <p className="mt-4 text-muted-foreground">Straight answers about booking, agents, and enterprise rollout.</p>
      <div className="mt-10 space-y-4">
        {items.map((item) => (
          <Card key={item.q} className="rounded-2xl">
            <CardContent className="p-6">
              <p className="font-medium">{item.q}</p>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.a}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
