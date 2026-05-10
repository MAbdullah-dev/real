import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MOCK_PROPERTIES } from "@/data/properties";
import Link from "next/link";

export default function AgentPropertiesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Properties</h1>
          <p className="mt-2 text-sm text-muted-foreground">Draft / published states with media completeness checks.</p>
        </div>
        <Button asChild className="rounded-full">
          <Link href="/agent/properties/new">Add property</Link>
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>City</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {MOCK_PROPERTIES.slice(0, 8).map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{p.title}</TableCell>
              <TableCell>{p.city}</TableCell>
              <TableCell>
                <Badge>Published</Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button asChild variant="ghost" size="sm" className="rounded-full">
                  <Link href={`/agent/properties/${p.id}/edit`}>Edit</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
