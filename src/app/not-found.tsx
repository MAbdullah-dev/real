import { Compass } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-20 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Compass className="h-7 w-7" aria-hidden />
      </span>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight">We can&apos;t find that page</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        The listing may have been sold, let, or taken down by its owner. Search the live
        inventory instead.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <Button asChild className="rounded-full">
          <Link href="/search">Search properties</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </main>
  );
}
