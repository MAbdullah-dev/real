import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const rows = Array.from({ length: 6 }).map((_, i) => ({
  id: `USR-${1200 + i}`,
  name: `Client ${i + 1}`,
  email: `client${i + 1}@example.com`,
  role: i % 3 === 0 ? "Admin" : "Guest",
}));

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="mt-2 text-sm text-muted-foreground">Searchable directory with role-aware actions.</p>
        </div>
        <Input placeholder="Search users" className="max-w-xs rounded-full" />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-mono text-xs">{r.id}</TableCell>
              <TableCell>{r.name}</TableCell>
              <TableCell>{r.email}</TableCell>
              <TableCell>
                <Badge variant={r.role === "Admin" ? "default" : "secondary"}>{r.role}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
