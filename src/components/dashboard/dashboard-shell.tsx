"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
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
    <nav className="flex flex-col gap-1">
      {nav.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {item.label}
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
        <div className="flex h-full max-h-screen flex-col gap-8 px-7 py-10 sticky top-0">
          <div>
            <Link href="/" className="text-sm font-semibold tracking-tight">
              ← Estate Elite
            </Link>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
          </div>
          <DashboardNavLinks nav={nav} pathname={pathname} />
          <div className="mt-auto flex items-center justify-between border-t border-border pt-6">
            <ThemeToggle />
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link href="/">Exit</Link>
            </Button>
          </div>
        </div>
      </aside>

      <div className="min-h-screen">
        <header className="flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur-xl lg:hidden">
          <p className="text-sm font-semibold">{title}</p>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Sheet>
              <SheetTrigger asChild>
                <Button size="icon" variant="outline" className="rounded-full" aria-label="Open navigation">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[min(100vw-2rem,320px)]">
                <div className="pt-10">
                  <DashboardNavLinks nav={nav} pathname={pathname} />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </header>
        <div className="min-w-0 px-[var(--section-x)] py-8 sm:py-10 lg:px-12 lg:py-12">
          {children}
        </div>
      </div>
    </div>
  );
}
