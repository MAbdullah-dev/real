import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function UserOverviewPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your saved homes, visit pipeline, and concierge notifications — wired to React Query in production.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {["Saved", "Active requests", "Upcoming visits"].map((label) => (
          <Card key={label} className="rounded-3xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tabular-nums">—</p>
              <Skeleton className="mt-3 h-2 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
