import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Invoice" };

export default function InvoicePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <Card className="rounded-3xl">
        <CardContent className="p-8 sm:p-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Invoice</p>
              <p className="mt-2 text-2xl font-semibold">EE-2048</p>
              <p className="mt-1 text-sm text-muted-foreground">Issued May 11, 2026</p>
            </div>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="#">Download PDF</Link>
            </Button>
          </div>
          <Separator className="my-8" />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Premium plan · monthly</span>
              <span className="font-medium tabular-nums">$129.00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Concierge onboarding</span>
              <span className="font-medium tabular-nums">$0.00</span>
            </div>
          </div>
          <Separator className="my-8" />
          <div className="flex justify-between text-base font-semibold">
            <span>Total due</span>
            <span className="tabular-nums">$129.00</span>
          </div>
          <p className="mt-8 text-xs text-muted-foreground">
            Wire instructions and tax IDs ship with enterprise contracts — this page is a UI placeholder.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
