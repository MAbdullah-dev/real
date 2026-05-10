import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const rows = [
  { id: "BR-1024", property: "Skyline Residence", status: "Pending", date: "May 12" },
  { id: "BR-1021", property: "Coastal Villa", status: "Confirmed", date: "May 18" },
];

export default function UserBookingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Booking requests</h1>
        <p className="mt-2 text-sm text-muted-foreground">Operational states mirror your concierge desk.</p>
      </div>
      <Card className="rounded-3xl border-none bg-transparent shadow-none">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Window</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.id}</TableCell>
                  <TableCell>{r.property}</TableCell>
                  <TableCell>
                    <Badge variant={r.status === "Confirmed" ? "default" : "secondary"}>{r.status}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{r.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
