import { Card, CardContent } from "@/components/ui/card";

export default function AgentMessagesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
      <Card className="rounded-3xl">
        <CardContent className="p-8 text-sm text-muted-foreground">
          Threaded inbox with read receipts — wire to Stream, Sendbird, or custom WebSockets.
        </CardContent>
      </Card>
    </div>
  );
}
