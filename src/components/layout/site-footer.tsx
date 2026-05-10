import { LayoutWide } from "@/components/layout/shell";
import { Building2, Globe2, MessageCircle, Share2 } from "lucide-react";
import Link from "next/link";

const columns = [
  {
    title: "Marketplace",
    links: [
      { href: "/search", label: "Browse properties" },
      { href: "/categories/luxury", label: "Luxury collection" },
      { href: "/categories/new-project", label: "New projects" },
      { href: "/wishlist", label: "Saved homes" },
    ],
  },
  {
    title: "Professionals",
    links: [
      { href: "/pricing", label: "Agent subscriptions" },
      { href: "/agent", label: "Agent dashboard" },
      { href: "/contact", label: "Partner with us" },
      { href: "/faq", label: "FAQ" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/blog", label: "Journal" },
      { href: "/contact", label: "Contact" },
      { href: "/auth/register", label: "Create account" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <LayoutWide className="py-14 sm:py-16 lg:py-20">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-soft)]">
                <Building2 className="h-5 w-5" />
              </span>
              Estate Elite
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              A luxury real estate marketplace for curated homes, commercial assets, and
              white-glove visit scheduling — built for discerning guests and professional agents.
            </p>
            <div className="mt-6 flex gap-3">
              {[Share2, MessageCircle, Globe2].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Social"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          <div className="grid gap-8 sm:grid-cols-3 lg:col-span-8">
            {columns.map((col) => (
              <div key={col.title}>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {col.title}
                </p>
                <ul className="mt-4 space-y-3 text-sm">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-foreground/80 hover:text-foreground">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-4 border-t border-border pt-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Estate Elite. All rights reserved.</p>
          <div className="flex flex-wrap gap-4">
            <Link href="#" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="#" className="hover:text-foreground">
              Terms
            </Link>
            <Link href="#" className="hover:text-foreground">
              Sitemap
            </Link>
          </div>
        </div>
      </LayoutWide>
    </footer>
  );
}
