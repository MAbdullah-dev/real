import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { MOCK_PROPERTIES } from "../src/data/properties";
import { SUBSCRIPTION_PLANS } from "../src/data/plans";

const prisma = new PrismaClient();

const SEED_PASSWORD = "Password123!";

const agents = [
  {
    id: "a1",
    name: "Amelia Laurent",
    email: "amelia@estate-elite.local",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1600&q=80",
    agency: "Laurent & Partners",
    phone: "+1 (555) 010-2048",
  },
  {
    id: "a2",
    name: "Marcus Vance",
    email: "marcus@estate-elite.local",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=1600&q=80",
    agency: "Vance Advisory",
    phone: "+1 (555) 010-3310",
  },
  {
    id: "a3",
    name: "Sofia Rahman",
    email: "sofia@estate-elite.local",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=1600&q=80",
    agency: "Rahman Estates",
    phone: "+1 (555) 010-4488",
  },
] as const;

async function main() {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

  for (const plan of SUBSCRIPTION_PLANS) {
    await prisma.plan.upsert({
      where: { id: plan.id },
      update: {
        name: plan.name,
        description: plan.description,
        priceMonthly: plan.priceMonthly,
        listingLimit: plan.listingLimit === "custom" ? null : plan.listingLimit,
        features: plan.features,
        highlighted: Boolean(plan.highlighted),
      },
      create: {
        id: plan.id,
        name: plan.name,
        description: plan.description,
        priceMonthly: plan.priceMonthly,
        listingLimit: plan.listingLimit === "custom" ? null : plan.listingLimit,
        features: plan.features,
        highlighted: Boolean(plan.highlighted),
      },
    });
  }

  const admin = await prisma.user.upsert({
    where: { email: "admin@estate-elite.local" },
    update: { passwordHash, role: "ADMIN", name: "Estate Admin" },
    create: {
      id: "admin",
      name: "Estate Admin",
      email: "admin@estate-elite.local",
      passwordHash,
      role: "ADMIN",
    },
  });

  const guest = await prisma.user.upsert({
    where: { email: "guest@estate-elite.local" },
    update: { passwordHash, role: "USER", name: "Guest User" },
    create: {
      id: "guest",
      name: "Guest User",
      email: "guest@estate-elite.local",
      passwordHash,
      role: "USER",
    },
  });

  for (const agent of agents) {
    await prisma.user.upsert({
      where: { email: agent.email },
      update: {
        passwordHash,
        role: "AGENT",
        name: agent.name,
        image: agent.image,
      },
      create: {
        id: agent.id,
        name: agent.name,
        email: agent.email,
        image: agent.image,
        passwordHash,
        role: "AGENT",
      },
    });

    await prisma.agentProfile.upsert({
      where: { userId: agent.id },
      update: {
        agency: agent.agency,
        phone: agent.phone,
        verified: true,
        bio: "Represents institutional and private clients with a focus on discreet transactions, media-forward listings, and white-glove visit planning.",
      },
      create: {
        userId: agent.id,
        agency: agent.agency,
        phone: agent.phone,
        verified: true,
        bio: "Represents institutional and private clients with a focus on discreet transactions, media-forward listings, and white-glove visit planning.",
      },
    });
  }

  await prisma.subscription.upsert({
    where: { id: "sub-amelia-premium" },
    update: { status: "active", planId: "premium" },
    create: {
      id: "sub-amelia-premium",
      userId: "a1",
      planId: "premium",
      status: "active",
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  for (const property of MOCK_PROPERTIES) {
    await prisma.property.upsert({
      where: { id: property.id },
      update: {
        slug: property.slug,
        title: property.title,
        description: property.description,
        address: property.address,
        city: property.city,
        country: property.country,
        price: property.price,
        purpose: property.purpose,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        areaSqm: property.areaSqm,
        rating: property.rating,
        reviewCount: property.reviewCount,
        categories: property.categories,
        amenities: property.amenities,
        badges: property.badges ?? [],
        furnished: property.furnished,
        videoUrl: property.videoUrl,
        lat: property.coordinates?.lat,
        lng: property.coordinates?.lng,
        status: "published",
        agentId: property.agentId,
      },
      create: {
        id: property.id,
        slug: property.slug,
        title: property.title,
        description: property.description,
        address: property.address,
        city: property.city,
        country: property.country,
        price: property.price,
        purpose: property.purpose,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        areaSqm: property.areaSqm,
        rating: property.rating,
        reviewCount: property.reviewCount,
        categories: property.categories,
        amenities: property.amenities,
        badges: property.badges ?? [],
        furnished: property.furnished,
        videoUrl: property.videoUrl,
        lat: property.coordinates?.lat,
        lng: property.coordinates?.lng,
        status: "published",
        agentId: property.agentId,
      },
    });

    await prisma.propertyImage.deleteMany({ where: { propertyId: property.id } });
    await prisma.propertyImage.createMany({
      data: [
        { propertyId: property.id, url: property.image, sortOrder: 0, isCover: true },
        ...property.gallery.map((url, index) => ({
          propertyId: property.id,
          url,
          sortOrder: index + 1,
          isCover: false,
        })),
      ],
    });
  }

  const faqs = [
    {
      id: "faq-1",
      question: "How do visit requests work?",
      answer:
        "Submit a window that suits you. Our operations desk confirms by phone, aligns with the listing agent, and sends a structured itinerary.",
      sortOrder: 1,
    },
    {
      id: "faq-2",
      question: "Can I list commercial assets?",
      answer:
        "Yes — offices, retail, and mixed-use use the same media standards with additional diligence fields.",
      sortOrder: 2,
    },
    {
      id: "faq-3",
      question: "Do you integrate with our CRM?",
      answer:
        "Enterprise plans include webhooks and batch exports; native Salesforce and HubSpot connectors are on the roadmap.",
      sortOrder: 3,
    },
    {
      id: "faq-4",
      question: "Is there a mobile app?",
      answer:
        "The web experience is mobile-first; native apps are planned once AR/360 consumption crosses threshold.",
      sortOrder: 4,
    },
  ];

  for (const faq of faqs) {
    await prisma.faqItem.upsert({
      where: { id: faq.id },
      update: faq,
      create: { ...faq, published: true },
    });
  }

  const posts = [
    {
      id: "post-1",
      slug: "luxury-visit-design",
      title: "Designing luxury visits like hospitality",
      excerpt: "Operational patterns borrowed from boutique hotels applied to property tours.",
      body: "The best property platforms borrow operational rigor from hospitality: predictable arrivals, host continuity, and surprise removal. Visits should feel inevitable, not improvised.",
      publishedAt: new Date("2026-04-02"),
    },
    {
      id: "post-2",
      slug: "media-standards",
      title: "Media standards that actually convert",
      excerpt: "Lighting, lensing, and narrative sequencing for high-net-worth buyers.",
      body: "Buyers decide in seconds — lead with honest light, show volume through sequence, and never hide awkward corners. Authenticity signals trust.",
      publishedAt: new Date("2026-03-18"),
    },
  ];

  for (const post of posts) {
    await prisma.blogPost.upsert({
      where: { slug: post.slug },
      update: post,
      create: post,
    });
  }

  await prisma.adminSetting.upsert({
    where: { key: "approve" },
    update: { value: true },
    create: { key: "approve", value: true },
  });
  await prisma.adminSetting.upsert({
    where: { key: "refunds" },
    update: { value: true },
    create: { key: "refunds", value: true },
  });
  await prisma.adminSetting.upsert({
    where: { key: "pii" },
    update: { value: false },
    create: { key: "pii", value: false },
  });

  await prisma.booking.upsert({
    where: { id: "BR-1024" },
    update: {},
    create: {
      id: "BR-1024",
      propertyId: "1",
      userId: guest.id,
      name: guest.name ?? "Guest User",
      email: guest.email ?? "guest@estate-elite.local",
      phone: "+1 (555) 010-1000",
      requestedDates: "Apr 20–24 mornings",
      notes: "Looking for a marina-facing penthouse for a family relocation.",
      status: "pending",
    },
  });

  await prisma.booking.upsert({
    where: { id: "BR-1021" },
    update: {},
    create: {
      id: "BR-1021",
      propertyId: "12",
      userId: guest.id,
      name: guest.name ?? "Guest User",
      email: guest.email ?? "guest@estate-elite.local",
      phone: "+1 (555) 010-1000",
      requestedDates: "May 3 weekend",
      notes: "Short-stay due diligence before a 60-night lease.",
      status: "confirmed",
      visitDate: new Date("2026-05-03T16:00:00Z"),
    },
  });

  await prisma.notification.createMany({
    data: [
      {
        id: "n1",
        userId: guest.id,
        title: "Visit window proposed",
        body: "Amelia Laurent suggested Thursday 4:30pm for Skyline Residence.",
      },
      {
        id: "n2",
        userId: guest.id,
        title: "Document vault ready",
        body: "HOA pack and floor plans are available for Coastal Villa — Algarve.",
      },
    ],
    skipDuplicates: true,
  });

  console.log("Seed complete.");
  console.log("  Admin  admin@estate-elite.local / Password123!");
  console.log("  Guest  guest@estate-elite.local / Password123!");
  console.log("  Agent  amelia@estate-elite.local / Password123!");
  console.log(`  Users: admin=${admin.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
