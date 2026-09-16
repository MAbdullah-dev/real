"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Card className="rounded-3xl border-destructive/30">
      <CardContent className="flex flex-col items-start gap-4 p-8">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertTriangle className="h-6 w-6" aria-hidden />
        </span>
        <div>
          <h2 className="text-lg font-semibold">This section didn&apos;t load</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Your viewings and saved properties are safe. Retry, or jump to another part of
            your workspace.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" className="rounded-full" onClick={reset}>
            Try again
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/dashboard">Back to overview</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
