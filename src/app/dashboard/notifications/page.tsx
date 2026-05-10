import { Card, CardContent } from "@/components/ui/card";

const items = [
  { title: "Visit confirmed", body: "Coastal Villa — Apr 20 morning slot locked with agent.", time: "2h ago" },
  { title: "Document request", body: "Upload proof of funds to accelerate offer review.", time: "Yesterday" },
];

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
      <div className="space-y-3">
        {items.map((n) => (
          <Card key={n.title} className="rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-4">
                <p className="font-medium">{n.title}</p>
                <span className="text-xs text-muted-foreground">{n.time}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{n.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
