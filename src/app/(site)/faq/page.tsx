import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { LayoutContainer } from "@/components/layout/shell";
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
    <LayoutContainer className="mx-auto max-w-3xl py-16 sm:py-20 lg:py-24">
      <h1 className="text-4xl font-semibold tracking-tight">Frequently asked</h1>
      <p className="mt-4 text-muted-foreground">Straight answers about booking, agents, and enterprise rollout.</p>
      <Accordion type="single" collapsible className="mt-10 space-y-4">
        {items.map((item) => (
          <AccordionItem key={item.q} value={item.q}>
            <AccordionTrigger>{item.q}</AccordionTrigger>
            <AccordionContent>{item.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </LayoutContainer>
  );
}
