import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AgentProfilePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Agency profile</h1>
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Verification & contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="agency">Agency name</Label>
            <Input id="agency" defaultValue="Laurent & Partners" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Operations phone</Label>
            <Input id="phone" defaultValue="+1 (555) 010-2048" />
          </div>
          <Button className="rounded-full">Save</Button>
        </CardContent>
      </Card>
    </div>
  );
}
