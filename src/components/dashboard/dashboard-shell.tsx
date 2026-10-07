"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { DashboardNavItem } from "@/config/dashboard-nav";
import { signOutAction } from "@/server/actions/auth";
import { cn } from "@/lib/utils";

function matchesNavItem(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Only the most specific matching href is active (avoids `/agent` lighting up on every page). */
function isNavActive(pathname: string, href: string, nav: { href: string }[]) {
  const matches = nav.filter((item) => matchesNavItem(pathname, item.href));
  if (matches.length === 0) return false;
  const best = matches.reduce((a, b) => (a.href.length >= b.href.length ? a : b));
  return best.href === href;
}

function DashboardNavLinks({
  nav,
  pathname,
  badges,
  onNavigate,
}: {
  nav: DashboardNavItem[];
  pathname: string;
  badges?: Record<string, number>;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-0.5" aria-label="Dashboard navigation">
      {nav.map((item, index) => {
        const active = isNavActive(pathname, item.href, nav);
        // A heading shows once, on the first item of each section run.
        const showSection = item.section && item.section !== nav[index - 1]?.section;
        return (
          <div key={item.href}>
            {showSection ? (
              <p className="mb-1 mt-4 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground first:mt-0">
                {item.section}
              </p>
            ) : null}
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              {active ? (
                <span
                  className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-primary"
                  aria-hidden
                />
              ) : null}
              <span className={cn("inline-block", active && "pl-2")}>{item.label}</span>
              {badges?.[item.href] ? (
                <span
                  className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground"
                  aria-label={`${badges[item.href]} need attention`}
                >
                  {badges[item.href] > 9 ? "9+" : badges[item.href]}
                </span>
              ) : null}
            </Link>
          </div>
        );
      })}
    </nav>
  );
}

export function DashboardShell({
  title,
  nav,
  user,
  badges,
  headerAction,
  children,
}: {
  title: string;
  nav: DashboardNavItem[];
  user?: { name?: string | null; email?: string | null };
  /** Action counts keyed by nav href. */
  badges?: Record<string, number>;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-muted/20 lg:grid lg:grid-cols-[272px_1fr]">
      <aside className="hidden border-r border-border bg-card/80 backdrop-blur-xl lg:block">
        <div className="sticky top-0 flex h-full max-h-screen flex-col gap-7 px-6 py-9">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm font-semibold tracking-tight text-muted-foreground transition-colors hover:text-foreground"
            >
              <span aria-hidden>←</span>
              Estate Elite
            </Link>
            <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {title}
            </p>
          </div>
          <DashboardNavLinks nav={nav} pathname={pathname} badges={badges} />
          <div className="mt-auto space-y-3 border-t border-border pt-5">
            {user?.email ? (
              <p className="truncate px-1 text-xs text-muted-foreground">{user.name ?? user.email}</p>
            ) : null}
            <div className="flex items-center justify-between">
              <ThemeToggle />
              <form action={signOutAction}>
                <Button type="submit" variant="outline" size="sm">
                  Sign out
                </Button>
              </form>
            </div>
          </div>
        </div>
      </aside>

      <div className="min-h-screen">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border/70 bg-background/85 px-[var(--section-x)] py-3 backdrop-blur-xl">
          <p className="text-sm font-semibold tracking-tight lg:hidden">{title}</p>
          <div className="ml-auto flex items-center gap-1.5">
            {headerAction}
            <div className="lg:hidden">
              <ThemeToggle />
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button size="icon" variant="outline" aria-label="Open navigation" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[min(100vw-2rem,320px)]">
                <SheetTitle className="sr-only">{title} menu</SheetTitle>
                <SheetDescription className="sr-only">
                  Navigate between sections of your dashboard.
                </SheetDescription>
                <div className="pt-10">
                  <p className="px-3 pb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {title}
                  </p>
                  <DashboardNavLinks nav={nav} pathname={pathname} badges={badges} />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </header>
        <div className="min-w-0 px-[var(--section-x)] py-7 sm:py-10 lg:px-10 lg:py-12 xl:px-14">
          {children}
        </div>
      </div>
    </div>
  );
}
