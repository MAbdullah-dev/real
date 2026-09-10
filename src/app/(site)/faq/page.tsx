import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { LayoutContainer } from "@/components/layout/shell";
import { listPublishedFaqs } from "@/server/content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ",
};

export default async function FaqPage() {
  const items = await listPublishedFaqs();

  return (
    <LayoutContainer className="mx-auto max-w-3xl py-16 sm:py-20 lg:py-24">
      <h1 className="text-4xl font-semibold tracking-tight">Frequently asked</h1>
      <p className="mt-4 text-muted-foreground">Straight answers about booking, agents, and enterprise rollout.</p>
      <Accordion type="single" collapsible className="mt-10 space-y-4">
        {items.map((item) => (
          <AccordionItem key={item.id} value={item.id}>
            <AccordionTrigger>{item.question}</AccordionTrigger>
            <AccordionContent>{item.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </LayoutContainer>
  );
}
