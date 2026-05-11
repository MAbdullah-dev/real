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
import { cn } from "@/lib/utils";

function DashboardNavLinks({
  nav,
  pathname,
  onNavigate,
}: {
  nav: { href: string; label: string }[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-0.5" aria-label="Dashboard navigation">
      {nav.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative rounded-xl px-3 py-2 text-sm font-medium transition-colors",
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
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardShell({
  title,
  nav,
  children,
}: {
  title: string;
  nav: { href: string; label: string }[];
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
          <DashboardNavLinks nav={nav} pathname={pathname} />
          <div className="mt-auto flex items-center justify-between border-t border-border pt-5">
            <ThemeToggle />
            <Button asChild variant="outline" size="sm">
              <Link href="/">Exit</Link>
            </Button>
          </div>
        </div>
      </aside>

      <div className="min-h-screen">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/70 bg-background/85 px-[var(--section-x)] py-3 backdrop-blur-xl lg:hidden">
          <p className="text-sm font-semibold tracking-tight">{title}</p>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <Sheet>
              <SheetTrigger asChild>
                <Button size="icon" variant="outline" aria-label="Open navigation">
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
                  <DashboardNavLinks nav={nav} pathname={pathname} />
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
