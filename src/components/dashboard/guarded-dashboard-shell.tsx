import { Suspense } from "react";
import type { Role } from "@prisma/client";

import { Skeleton } from "@/components/ui/skeleton";
import { requireRole } from "@/server/auth";

import { DashboardShell } from "./dashboard-shell";

function DashboardShellFallback() {
  return (
    <div className="min-h-screen bg-muted/20 px-[var(--section-x)] py-10">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="mt-6 h-64 w-full rounded-3xl" />
    </div>
  );
}

async function DashboardAuth({
  title,
  nav,
  roles,
  children,
}: {
  title: string;
  nav: { href: string; label: string }[];
  roles: Role[];
  children: React.ReactNode;
}) {
  const session = await requireRole(roles);
  return (
    <DashboardShell title={title} nav={nav} user={session.user}>
      {children}
    </DashboardShell>
  );
}

export function GuardedDashboardShell({
  title,
  nav,
  roles,
  children,
}: {
  title: string;
  nav: { href: string; label: string }[];
  roles: Role[];
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<DashboardShellFallback />}>
      <DashboardAuth title={title} nav={nav} roles={roles}>
        {children}
      </DashboardAuth>
    </Suspense>
  );
}
