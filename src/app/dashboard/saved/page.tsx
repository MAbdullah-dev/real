import { EmptyState } from "@/components/ui/empty-state";
import { Heart } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function SavedPropertiesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Saved properties</h1>
        <p className="mt-2 text-sm text-muted-foreground">Mirrors the public wishlist with CRM-ready metadata.</p>
      </div>
      <EmptyState
        icon={Heart}
        title="Sync wishlist"
        description="Connect a user session to persist saved listings across devices."
        action={{ label: "Open wishlist", href: "/wishlist" }}
      />
      <Button asChild variant="outline" className="rounded-full">
        <Link href="/wishlist">View public wishlist UI</Link>
      </Button>
    </div>
  );
}
