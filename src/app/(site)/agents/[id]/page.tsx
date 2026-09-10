import { LayoutWide } from "@/components/layout/shell";
import { PropertyCard } from "@/components/property/property-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getPublicAgent, listPublicAgentIds } from "@/server/agents";
import { Award, MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  const agents = await listPublicAgentIds();
  return agents.map(({ id }) => ({ id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const agent = await getPublicAgent(id);
  if (!agent) return { title: "Agent" };
  return { title: `${agent.name} · Agent` };
}

export default async function AgentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agent = await getPublicAgent(id);
  if (!agent) notFound();

  return (
    <LayoutWide className="py-12 sm:py-14 lg:py-16">
      <div className="grid gap-10 lg:grid-cols-[320px_1fr] lg:items-start">
        <Card className="rounded-3xl lg:sticky lg:top-24">
          <CardContent className="p-8">
            <Avatar className="h-20 w-20">
              <AvatarImage src={agent.image} alt={agent.name} />
              <AvatarFallback>{agent.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <h1 className="mt-6 text-2xl font-semibold">{agent.name}</h1>
            <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {agent.agency ?? "Multi-market listings"}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {agent.verified ? <Badge variant="default">Verified</Badge> : null}
              {agent.planName ? <Badge variant="secondary">{agent.planName}</Badge> : null}
            </div>
            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">{agent.bio}</p>
            <div className="mt-6 grid gap-3">
              {agent.phone ? (
                <Button asChild className="rounded-full gap-2">
                  <a href={`tel:${agent.phone.replace(/[^+\d]/g, "")}`}>
                    <Phone className="h-4 w-4" />
                    {agent.phone}
                  </a>
                </Button>
              ) : null}
              <Button
                asChild
                variant={agent.phone ? "outline" : "default"}
                className="rounded-full"
              >
                <Link href="/contact">Request introduction</Link>
              </Button>
            </div>
            <div className="mt-8 rounded-2xl bg-muted/50 p-4 text-sm">
              <div className="flex items-center gap-2 font-medium">
                <Award className="h-4 w-4 text-primary" />
                Performance snapshot
              </div>
              <ul className="mt-3 space-y-2 text-muted-foreground">
                <li>Active listings · {agent.listings.length}</li>
                <li>Visit requests · {agent.totalBookings}</li>
                <li>Completed visits · {agent.completedVisits}</li>
                {agent.averageRating != null ? (
                  <li>Average listing rating · {agent.averageRating.toFixed(1)}</li>
                ) : null}
              </ul>
            </div>
          </CardContent>
        </Card>
        <div>
          <h2 className="text-xl font-semibold">Active listings</h2>
          <div className="mt-8 grid gap-8 md:grid-cols-2 xl:grid-cols-2">
            {agent.listings.map((p, i) => (
              <PropertyCard key={p.id} property={p} index={i} layout="showcase" />
            ))}
          </div>
        </div>
      </div>
    </LayoutWide>
  );
}
