"use client";

import { motion } from "framer-motion";
import {
  BadgeCheck,
  Box,
  Cpu,
  Globe2,
  Headphones,
  Quote,
  ShieldCheck,
  Sparkles,
  Waves,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { LayoutContainer, LayoutWide } from "@/components/layout/shell";
import { SUBSCRIPTION_PLANS } from "@/data/plans";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const cities = [
  { name: "Dubai", image: "photo-1512453979798-5ea266f8880c", tag: "Marina & Downtown" },
  { name: "Lisbon", image: "photo-1585208798174-6cedd86e019a", tag: "Design-led living" },
  { name: "Miami", image: "photo-1506905925346-21bda4d32df4", tag: "Waterfront energy" },
  { name: "London", image: "photo-1529655683826-aba9b3e77383", tag: "Heritage meets modern" },
];

const testimonials = [
  {
    quote:
      "The visit choreography felt closer to a private bank than a property site. Our weekend in Lisbon was flawless.",
    name: "Elena Voss",
    role: "Family office principal",
  },
  {
    quote:
      "As an agent, the subscription tiers match how we actually scale listings. Approvals are fast and professional.",
    name: "Jordan Blake",
    role: "Founder, Blake Realty",
  },
];

const agents = [
  {
    id: "a1",
    name: "Amelia Laurent",
    city: "Dubai · Lisbon",
    focus: "Ultra-luxury residential",
    image: "photo-1494790108377-be9c29b29330",
  },
  {
    id: "a2",
    name: "Marcus Vance",
    city: "Miami · NYC",
    focus: "Commercial & mixed-use",
    image: "photo-1472099645785-5658abf4ff4e",
  },
  {
    id: "a3",
    name: "Sofia Rahman",
    city: "London · Istanbul",
    focus: "New developments",
    image: "photo-1438761681033-6461ffad8d80",
  },
];

const why = [
  {
    title: "Human-confirmed visits",
    body: "Every reservation is reviewed by our operations team — no phantom bookings, no surprise overlaps.",
    icon: Headphones,
  },
  {
    title: "Verified supply",
    body: "Agents are subscription-backed with listing caps, media standards, and compliance checkpoints.",
    icon: BadgeCheck,
  },
  {
    title: "Global, locally sharp",
    body: "Neighborhood intelligence, school districts, and commute modeling baked into the experience.",
    icon: Globe2,
  },
];

export function FeaturedCities() {
  return (
    <section className="py-16 sm:py-20 lg:py-24">
      <LayoutWide>
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Featured cities</h2>
          <p className="mt-3 text-muted-foreground">
            Start with destinations our clients return to — each with on-ground hosts and curated inventory.
          </p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {cities.map((c, i) => (
            <motion.div
              key={c.name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
            >
              <Link
                href={`/search?q=${encodeURIComponent(c.name)}`}
                className="group block overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-card)]"
              >
                <div className="relative aspect-[4/5]">
                  <Image
                    src={`https://images.unsplash.com/${c.image}?auto=format&fit=crop&w=900&q=80`}
                    alt={c.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition duration-700 group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-lg font-semibold">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.tag}</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </LayoutWide>
    </section>
  );
}

export function Testimonials() {
  return (
    <section className="border-y border-border bg-muted/25 py-16 sm:py-20 lg:py-24">
      <LayoutWide>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Trusted by discerning clients</h2>
            <p className="mt-3 max-w-xl text-muted-foreground">
              We optimize for clarity, speed, and discretion — the same pillars as leading luxury hospitality brands.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            SOC2-ready operations posture
          </div>
        </div>
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {testimonials.map((t) => (
            <Card key={t.name} className="rounded-3xl border-border/80">
              <CardContent className="p-8">
                <Quote className="h-8 w-8 text-primary/30" />
                <p className="mt-4 text-lg leading-relaxed">{t.quote}</p>
                <p className="mt-6 text-sm font-semibold">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </LayoutWide>
    </section>
  );
}

export function AgentHighlights() {
  return (
    <section className="py-16 sm:py-20 lg:py-24">
      <LayoutWide>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Agent highlights</h2>
            <p className="mt-3 text-muted-foreground">
              Meet a few of the professionals powering our marketplace — vetted, subscription-backed, and media-ready.
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-full self-start sm:self-auto">
            <Link href="/pricing">Become a partner</Link>
          </Button>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {agents.map((a) => (
            <Card key={a.name} className="overflow-hidden rounded-3xl">
              <div className="relative aspect-[5/4]">
                <Image
                  src={`https://images.unsplash.com/${a.image}?auto=format&fit=crop&w=800&q=80`}
                  alt={a.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>
              <CardContent className="p-6">
                <p className="font-semibold">{a.name}</p>
                <p className="text-xs text-muted-foreground">{a.city}</p>
                <p className="mt-3 text-sm text-muted-foreground">{a.focus}</p>
                <Button asChild variant="ghost" className="mt-2 h-auto px-0 text-primary">
                  <Link href={`/agents/${a.id}`}>View profile</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </LayoutWide>
    </section>
  );
}

export function PlansPreview() {
  return (
    <section className="py-16 sm:py-20 lg:py-24">
      <LayoutWide>
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Subscription plans</h2>
          <p className="mt-3 text-muted-foreground">
            Listing caps that mirror how great brokerages actually scale — from boutique desks to enterprise teams.
          </p>
        </div>
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {SUBSCRIPTION_PLANS.map((plan) => (
            <Card
              key={plan.id}
              className={`rounded-3xl ${plan.highlighted ? "border-primary shadow-[var(--shadow-soft)] ring-1 ring-primary/20" : ""}`}
            >
              <CardContent className="p-8">
                <p className="text-sm font-semibold uppercase tracking-wide text-primary">{plan.name}</p>
                <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
                <p className="mt-6 text-3xl font-semibold tabular-nums">
                  ${plan.priceMonthly}
                  <span className="text-base font-normal text-muted-foreground">/mo</span>
                </p>
                <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
                  {plan.features.slice(0, 4).map((f) => (
                    <li key={f} className="flex gap-2">
                      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild className="mt-8 w-full rounded-full" variant={plan.highlighted ? "default" : "outline"}>
                  <Link href="/pricing">Compare plans</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </LayoutWide>
    </section>
  );
}

export function WhyChooseUs() {
  return (
    <section className="border-t border-border py-16 sm:py-20 lg:py-24">
      <LayoutWide>
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Why Estate Elite</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {why.map((item) => (
            <Card key={item.title} className="rounded-3xl border-border/80">
              <CardContent className="p-8">
                <item.icon className="h-9 w-9 text-primary" />
                <h3 className="mt-4 font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </LayoutWide>
    </section>
  );
}

export function ImmersivePreview() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28 lg:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/25 via-background to-background" />
      <LayoutWide className="relative">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Cpu className="h-3.5 w-3.5" />
              Future-ready media
            </div>
            <h2 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl text-balance">
              360° walkthroughs & AR room previews
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Placeholder experiences today — architected for WebXR, lidar scans, and virtual open houses. Your team
              can upgrade listings without migrating platforms.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button className="rounded-full gap-2">
                <Box className="h-4 w-4" />
                Launch demo scene
              </Button>
              <Button variant="outline" className="rounded-full gap-2">
                <Waves className="h-4 w-4" />
                Virtual visit mode
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="glass-panel relative overflow-hidden rounded-[2rem] p-1 shadow-[var(--shadow-soft)]">
              <div className="relative aspect-video overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-primary/30 via-background to-accent/20">
                <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.06)_1px,transparent_1px)] [background-size:32px_32px]" />
                <div className="absolute left-6 top-6 flex items-center gap-2 rounded-full bg-background/70 px-3 py-1 text-xs font-medium backdrop-blur-md">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                  </span>
                  Live spatial mesh · beta
                </div>
                <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/10 bg-background/55 p-4 backdrop-blur-xl">
                  <p className="text-sm font-medium">Interactive floor map</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Tap zones to preview finishes, lighting presets, and furniture layouts.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </LayoutWide>
    </section>
  );
}

const faqs = [
  {
    q: "Is booking instant?",
    a: "No — Estate Elite coordinates luxury visits like a concierge. You submit a request; our team confirms by phone and aligns schedules with the listing agent.",
  },
  {
    q: "How do agent subscriptions work?",
    a: "Plans cap active listings (Basic 3, Premium 6, Enterprise custom). Upgrades unlock richer media, analytics, and placement in curated categories.",
  },
  {
    q: "Do you support commercial assets?",
    a: "Yes — offices, retail, and mixed-use inventory live beside residential, with tailored diligence checklists.",
  },
];

export function FaqSection() {
  return (
    <section className="py-16 sm:py-20 lg:py-24">
      <LayoutContainer className="max-w-3xl">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">FAQ</h2>
        <div className="mt-8 space-y-4">
          {faqs.map((f) => (
            <Card key={f.q} className="rounded-2xl">
              <CardContent className="p-6">
                <p className="font-medium">{f.q}</p>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/faq">View all answers</Link>
          </Button>
        </div>
      </LayoutContainer>
    </section>
  );
}
