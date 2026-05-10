import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const rows = [
  { id: "a1", name: "Amelia Laurent", plan: "Premium", listings: 6 },
  { id: "a2", name: "Marcus Vance", plan: "Basic", listings: 3 },
  { id: "a3", name: "Sofia Rahman", plan: "Enterprise", listings: 24 },
];

export default function AdminAgentsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Agents</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Listings</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-mono text-xs">{r.id}</TableCell>
              <TableCell>{r.name}</TableCell>
              <TableCell>{r.plan}</TableCell>
              <TableCell>{r.listings}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
