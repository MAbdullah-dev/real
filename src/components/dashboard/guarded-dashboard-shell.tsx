import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import type { Role } from "@prisma/client";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardNavItem } from "@/config/dashboard-nav";
import { agencyConsoleAccess, requireAgency } from "@/server/agency";
import { requireRole } from "@/server/auth";
import { brokerConsoleAccess, requireBroker } from "@/server/broker";
import { navBadges } from "@/server/nav-badges";
import { requireSeller, sellerConsoleAccess } from "@/server/seller";

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
  nav: DashboardNavItem[];
  roles: Role[];
  children: React.ReactNode;
}) {
  const session = await requireRole(roles);
  const badges = await navBadges(session.user.id, session.user.role);

  let headerAction: React.ReactNode = null;

  if (roles.includes("AGENCY") && title === "Agency console") {
    const { agency, isAdmin } = await requireAgency();
    const access = agencyConsoleAccess(agency?.status);
    if (!isAdmin && access === "onboarding") {
      redirect("/auth/onboarding/agency");
    }
    if (isAdmin || access === "full" || access === "readonly") {
      headerAction = (
        <Button asChild size="sm" className="rounded-full">
          <Link href="/agency/properties/new">Add property</Link>
        </Button>
      );
    }
  }

  if (roles.includes("BROKER") && title === "Broker console") {
    const { profile, isAdmin } = await requireBroker();
    const access = brokerConsoleAccess(profile?.status);
    if (!isAdmin && access === "onboarding") {
      redirect("/auth/onboarding/broker");
    }
    if (isAdmin || access === "full" || access === "readonly") {
      headerAction = (
        <Button asChild size="sm" className="rounded-full">
          <Link href="/broker/properties/new">Add property</Link>
        </Button>
      );
    }
  }

  if (roles.includes("SELLER") && title === "Seller console") {
    const { profile, isAdmin } = await requireSeller();
    const access = sellerConsoleAccess(profile?.status);
    if (!isAdmin && access === "onboarding") {
      redirect("/auth/onboarding/seller");
    }
    if (isAdmin || access === "full" || access === "readonly") {
      headerAction = (
        <Button asChild size="sm" className="rounded-full">
          <Link href="/seller/properties/new">Add property</Link>
        </Button>
      );
    }
  }

  return (
    <DashboardShell
      title={title}
      nav={nav}
      user={session.user}
      badges={badges}
      headerAction={headerAction}
    >
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
  nav: DashboardNavItem[];
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
