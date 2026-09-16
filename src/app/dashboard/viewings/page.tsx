import { CalendarRange } from "lucide-react";
import { Suspense } from "react";

import { BuyerViewingCard } from "@/components/viewings/buyer-viewing-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAuth } from "@/server/auth";
import { groupUserViewings, listUserViewings } from "@/server/bookings";

export const metadata = { title: "Viewings" };

async function ViewingList() {
  const session = await requireAuth();
  const viewings = await listUserViewings(session.user.id);

  if (viewings.length === 0) {
    return (
      <EmptyState
        icon={CalendarRange}
        title="No viewings yet"
        description="Find a property you like and request a viewing — you can offer up to three times and change them later."
        action={{ label: "Browse properties", href: "/search" }}
      />
    );
  }

  const { upcoming, active, past } = groupUserViewings(viewings);

  return (
    <div className="space-y-10">
      {upcoming.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Coming up</h2>
          {upcoming.map((viewing) => (
            <BuyerViewingCard key={viewing.id} viewing={viewing} />
          ))}
        </section>
      ) : null}

      {active.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Waiting on a reply</h2>
          {active.map((viewing) => (
            <BuyerViewingCard key={viewing.id} viewing={viewing} />
          ))}
        </section>
      ) : null}

      {past.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">
            History <span className="font-normal text-muted-foreground">({past.length})</span>
          </h2>
          {past.map((viewing) => (
            <BuyerViewingCard key={viewing.id} viewing={viewing} />
          ))}
        </section>
      ) : null}
    </div>
  );
}

export default function BuyerViewingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Viewings</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Every visit you have asked for, where it stands, and what you can do next.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-64 w-full rounded-3xl" />}>
        <ViewingList />
      </Suspense>
    </div>
  );
}
