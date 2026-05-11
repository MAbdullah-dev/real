"use client";

import { motion } from "framer-motion";
import {
  Building2,
  ChevronDown,
  Heart,
  LayoutDashboard,
  Menu,
  Search,
  Shield,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useWishlistStore } from "@/store/wishlist-store";

import { ThemeToggle } from "./theme-toggle";

const exploreLinks = [
  { href: "/search", label: "Discover" },
  { href: "/categories/luxury", label: "Luxury collection" },
  { href: "/categories/new-project", label: "New projects" },
  { href: "/pricing", label: "Agent plans" },
  { href: "/blog", label: "Journal" },
];

function MobileNav({ isHome }: { isHome: boolean }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "lg:hidden rounded-full",
            isHome && "text-white hover:bg-white/10 hover:text-white"
          )}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[min(100vw-2rem,380px)]">
        <SheetTitle className="sr-only">Main menu</SheetTitle>
        <SheetDescription className="sr-only">
          Browse the site, open search, and sign in or create an account.
        </SheetDescription>
        <div className="flex flex-col gap-6 pt-8">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Building2 className="h-5 w-5" />
            </span>
            Estate Elite
          </Link>
          <nav className="flex flex-col gap-1">
            {exploreLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-xl px-3 py-2 text-sm font-medium hover:bg-muted"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex flex-col gap-2 border-t border-border pt-4">
            <Button asChild className="w-full rounded-full">
              <Link href="/auth/login">Sign in</Link>
            </Button>
            <Button asChild variant="outline" className="w-full rounded-full">
              <Link href="/auth/register">Create account</Link>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const wishlistCount = useWishlistStore((s) => s.ids.length);
  const isHome = pathname === "/";

  return (
    <motion.header
      initial={{ y: -8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "z-[60] w-full border-b transition-colors",
        isHome
          ? "absolute top-0 border-white/10 bg-black/25 text-white shadow-[inset_0_-1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl supports-[backdrop-filter]:bg-black/15"
          : "sticky top-0 border-border/60 bg-background/80 text-foreground backdrop-blur-xl"
      )}
    >
      <div className="mx-auto flex h-16 max-w-[var(--page-wide)] items-center gap-3 px-[var(--section-x)] sm:gap-4">
        <MobileNav isHome={isHome} />

        <Link
          href="/"
          className={cn(
            "flex items-center gap-2 font-semibold tracking-tight",
            isHome && "text-white drop-shadow-sm"
          )}
        >
          <span
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-2xl shadow-[var(--shadow-soft)]",
              isHome
                ? "bg-white text-black"
                : "bg-primary text-primary-foreground"
            )}
          >
            <Building2 className="h-5 w-5" />
          </span>
          <span className="hidden sm:inline text-base">Estate Elite</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn("rounded-full gap-1", isHome && "text-white hover:bg-white/10 hover:text-white")}
              >
                Explore
                <ChevronDown className="h-4 w-4 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Browse</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {exploreLinks.map((l) => (
                <DropdownMenuItem key={l.href} asChild>
                  <Link href={l.href}>{l.label}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            asChild
            variant="ghost"
            className={cn(
              "rounded-full",
              isHome && "text-white hover:bg-white/10 hover:text-white",
              !isHome && pathname.startsWith("/search") && "bg-muted"
            )}
          >
            <Link href="/search" className="gap-2">
              <Search className="h-4 w-4" />
              Search
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            className={cn("rounded-full", isHome && "text-white hover:bg-white/10 hover:text-white")}
          >
            <Link href="/contact">Concierge</Link>
          </Button>
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <ThemeToggle inverted={isHome} />
          <Button
            asChild
            variant="ghost"
            size="icon"
            className={cn("rounded-full relative", isHome && "text-white hover:bg-white/10 hover:text-white")}
          >
            <Link href="/wishlist" aria-label="Wishlist">
              <Heart className="h-5 w-5" />
              {wishlistCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {wishlistCount > 9 ? "9+" : wishlistCount}
                </span>
              ) : null}
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "hidden sm:inline-flex rounded-full gap-2",
                  isHome && "border-white/30 bg-white/10 text-white hover:bg-white/15 hover:text-white"
                )}
              >
                <UserRound className="h-4 w-4" />
                Account
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Workspace</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard" className="gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Guest dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/agent" className="gap-2">
                  <Building2 className="h-4 w-4" />
                  Agent console
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin" className="gap-2">
                  <Shield className="h-4 w-4" />
                  Admin
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/auth/login">Sign in</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/auth/register">Register</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            asChild
            size="sm"
            className={cn(
              "inline-flex rounded-full sm:hidden",
              isHome && "border-white/30 bg-white/10 text-white hover:bg-white/15"
            )}
            variant={isHome ? "outline" : "default"}
          >
            <Link href="/auth/login">Sign in</Link>
          </Button>
        </div>
      </div>
    </motion.header>
  );
}
