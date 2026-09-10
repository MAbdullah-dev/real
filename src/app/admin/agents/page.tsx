import Link from "next/link";
import { Suspense } from "react";

import { AgentVerifiedSwitch } from "@/components/admin/moderation-controls";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listAgentsWithStats } from "@/server/admin";

async function AgentsTable() {
  const agents = await listAgentsWithStats();

  if (agents.length === 0) {
    return <p className="text-sm text-muted-foreground">No agents yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Agency</TableHead>
          <TableHead>Plan</TableHead>
          <TableHead className="text-right">Listings</TableHead>
          <TableHead className="text-right">Verified</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {agents.map((agent) => (
          <TableRow key={agent.id}>
            <TableCell className="font-medium">
              <Link href={`/agents/${agent.id}`} className="hover:underline">
                {agent.name}
              </Link>
              <p className="text-xs text-muted-foreground">{agent.email}</p>
            </TableCell>
            <TableCell className="text-muted-foreground">{agent.agency}</TableCell>
            <TableCell>
              <Badge variant={agent.plan === "Free" ? "secondary" : "default"}>{agent.plan}</Badge>
            </TableCell>
            <TableCell className="text-right tabular-nums">{agent.listings}</TableCell>
            <TableCell className="flex justify-end">
              <AgentVerifiedSwitch userId={agent.id} verified={agent.verified} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function AdminAgentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Agents</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Verification badges control the trust marker on public profiles.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-64 w-full rounded-3xl" />}>
        <AgentsTable />
      </Suspense>
    </div>
  );
}
