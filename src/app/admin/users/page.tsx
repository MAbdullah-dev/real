import { Suspense } from "react";

import { UserRoleSelect } from "@/components/admin/moderation-controls";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listUsers } from "@/server/admin";

async function UsersTable({ query }: { query?: string }) {
  const users = await listUsers(query);

  if (users.length === 0) {
    return <p className="text-sm text-muted-foreground">No users match that search.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead className="text-right">Listings</TableHead>
          <TableHead className="text-right">Bookings</TableHead>
          <TableHead>Joined</TableHead>
          <TableHead className="text-right">Role</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">{user.name ?? "—"}</TableCell>
            <TableCell className="text-muted-foreground">{user.email}</TableCell>
            <TableCell className="text-right tabular-nums">{user._count.properties}</TableCell>
            <TableCell className="text-right tabular-nums">{user._count.bookings}</TableCell>
            <TableCell className="text-muted-foreground">
              {user.createdAt.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
            </TableCell>
            <TableCell className="flex justify-end">
              <UserRoleSelect userId={user.id} role={user.role} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Searchable directory with role-aware actions.
          </p>
        </div>
        <form className="w-full max-w-xs">
          <Input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search name or email"
            className="rounded-full"
          />
        </form>
      </div>
      <Suspense key={q ?? ""} fallback={<Skeleton className="h-64 w-full rounded-3xl" />}>
        <UsersTable query={q} />
      </Suspense>
    </div>
  );
}
