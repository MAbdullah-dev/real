import { CategoryPropertyRow } from "@/components/home/category-property-row";
import { CinematicHero } from "@/components/home/cinematic-hero";
import {
  AgentHighlights,
  FaqSection,
  FeaturedCities,
  ImmersivePreview,
  PlansPreview,
  Testimonials,
  WhyChooseUs,
} from "@/components/home/marketing-sections";
import { pickHeroProperties, propertiesByCategory } from "@/server/mappers";
import { listPlans } from "@/server/plans";
import { listPublishedProperties } from "@/server/properties";

const categoryRows = [
  {
    title: "Featured listings",
    subtitle: "Editorially spotlighted homes with exceptional media and provenance.",
    key: "featured" as const,
    href: "/categories/featured",
  },
  {
    title: "Luxury collection",
    subtitle: "Statement architecture, rare volumes, and hotel-grade services.",
    key: "luxury" as const,
    href: "/categories/luxury",
  },
  {
    title: "Penthouses & sky homes",
    subtitle: "Elevated living with panoramic glass and private outdoor rooms.",
    key: "penthouse" as const,
    href: "/categories/penthouse",
  },
  {
    title: "Beach houses",
    subtitle: "Salt air, soft light, and residences designed for slow weekends.",
    key: "beach" as const,
    href: "/categories/beach",
  },
  {
    title: "Villas & compounds",
    subtitle: "Generous land, guest wings, and indoor-outdoor entertaining.",
    key: "villa" as const,
    href: "/categories/villa",
  },
  {
    title: "Apartments & lofts",
    subtitle: "City-core living with craft details and intelligent floor plans.",
    key: "apartment" as const,
    href: "/categories/apartment",
  },
  {
    title: "Family homes",
    subtitle: "Room to grow, quiet bedrooms, and neighborhoods worth rooting in.",
    key: "family" as const,
    href: "/categories/family",
  },
  {
    title: "Smart homes",
    subtitle: "Responsive environments with predictive comfort and security.",
    key: "smart-home" as const,
    href: "/categories/smart-home",
  },
  {
    title: "New projects",
    subtitle: "Pre-completion inventory with transparent milestones.",
    key: "new-project" as const,
    href: "/categories/new-project",
  },
  {
    title: "Commercial & offices",
    subtitle: "HQ-ready spaces with hospitality-grade arrival sequences.",
    key: "office" as const,
    href: "/categories/office",
  },
  {
    title: "Retail & shops",
    subtitle: "High-visibility frontage for brands scaling physically.",
    key: "shop" as const,
    href: "/categories/shop",
  },
  {
    title: "Short stay",
    subtitle: "Turn-key residences calibrated for 30–90 night stays.",
    key: "short-stay" as const,
    href: "/categories/short-stay",
  },
  {
    title: "Farmhouses & estates",
    subtitle: "Agrarian calm with contemporary infrastructure.",
    key: "farmhouse" as const,
    href: "/categories/farmhouse",
  },
  {
    title: "Trending destinations",
    subtitle: "What global buyers are exploring this quarter.",
    key: "trending" as const,
    href: "/categories/trending",
  },
  {
    title: "Recommended for you",
    subtitle: "A personalized mix based on engagement signals — demo heuristic.",
    key: "recommended" as const,
    href: "/search?sort=rating",
  },
];

export default async function HomePage() {
  const [properties, plans] = await Promise.all([listPublishedProperties(), listPlans()]);
  const hero = pickHeroProperties(properties);

  return (
    <>
      <CinematicHero properties={hero} />
      {categoryRows.map((row) => (
        <CategoryPropertyRow
          key={row.key}
          title={row.title}
          subtitle={row.subtitle}
          properties={propertiesByCategory(properties, row.key)}
          viewAllHref={row.href}
        />
      ))}
      <FeaturedCities />
      <Testimonials />
      <AgentHighlights />
      <PlansPreview plans={plans} />
      <WhyChooseUs />
      <ImmersivePreview />
      <FaqSection />
    </>
  );
}
