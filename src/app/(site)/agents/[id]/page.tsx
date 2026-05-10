import { LayoutWide } from "@/components/layout/shell";
import { PropertyCard } from "@/components/property/property-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MOCK_PROPERTIES } from "@/data/properties";
import { Award, MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const p = MOCK_PROPERTIES.find((x) => x.agentId === id);
  if (!p) return { title: "Agent" };
  return { title: `${p.agentName} · Agent` };
}

export default async function AgentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const first = MOCK_PROPERTIES.find((x) => x.agentId === id);
  if (!first) notFound();

  const listings = MOCK_PROPERTIES.filter((x) => x.agentId === id);

  return (
    <LayoutWide className="py-12 sm:py-14 lg:py-16">
      <div className="grid gap-10 lg:grid-cols-[320px_1fr] lg:items-start">
        <Card className="rounded-3xl lg:sticky lg:top-24">
          <CardContent className="p-8">
            <Avatar className="h-20 w-20">
              <AvatarImage src={first.agentAvatar} alt={first.agentName} />
              <AvatarFallback>{first.agentName.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <h1 className="mt-6 text-2xl font-semibold">{first.agentName}</h1>
            <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              Multi-market listings
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="default">Verified</Badge>
              <Badge variant="secondary">Premium partner</Badge>
            </div>
            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
              Represents institutional and private clients with a focus on discreet transactions, media-forward
              listings, and white-glove visit planning.
            </p>
            <div className="mt-6 grid gap-3">
              <Button asChild className="rounded-full gap-2">
                <Link href="/contact">
                  <Phone className="h-4 w-4" />
                  Request introduction
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/pricing">View subscription</Link>
              </Button>
            </div>
            <div className="mt-8 rounded-2xl bg-muted/50 p-4 text-sm">
              <div className="flex items-center gap-2 font-medium">
                <Award className="h-4 w-4 text-primary" />
                Performance snapshot
              </div>
              <ul className="mt-3 space-y-2 text-muted-foreground">
                <li>Median days on market · 14</li>
                <li>Visit-to-offer conversion · 38%</li>
                <li>Client satisfaction · 4.9</li>
              </ul>
            </div>
          </CardContent>
        </Card>
        <div>
          <h2 className="text-xl font-semibold">Active listings</h2>
          <div className="mt-8 grid gap-8 md:grid-cols-2 xl:grid-cols-2">
            {listings.map((p, i) => (
              <PropertyCard key={p.id} property={p} index={i} layout="showcase" />
            ))}
          </div>
        </div>
      </div>
    </LayoutWide>
  );
}
