import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ADMIN_SETTINGS, ADMIN_SETTINGS_DEFAULT_ON } from "../src/data/admin-settings";
import {
  ACTIVE_SUBSCRIPTION_STATUSES,
  FREE_LISTING_LIMIT,
  LISTING_LIMIT_STATUSES,
  planIdForListingCount,
  planListingCap,
  SELLER_FREE_LISTING_LIMIT,
  SUBSCRIPTION_PLANS,
} from "../src/data/plans";
import { MOCK_PROPERTIES } from "../src/data/properties";
import { requiredCredentialTypes } from "../src/lib/agency-labels";
import { generateAllSlots } from "../src/lib/viewings";

const prisma = new PrismaClient();

const SEED_PASSWORD = "Password123!";
const REVIEWED_AT = new Date("2026-01-15T00:00:00.000Z");
/** Admin-published catalog. Agencies cannot self-publish; auto-publish stays off. */
const SEEDED_LISTING_STATUS = "published" as const;
const AGENCY_COUNTRY = "PK";
const AGENCY_TYPE = "agency" as const;
const SELLER_EMAIL = "seller@estate-elite.local";

const agents = [
  {
    id: "a1",
    name: "Amelia Laurent",
    email: "amelia@estate-elite.local",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1600&q=80",
    agency: "Laurent & Partners",
    phone: "+1 (555) 010-2048",
    agencyId: "agency-a1",
  },
  {
    id: "a2",
    name: "Marcus Vance",
    email: "marcus@estate-elite.local",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=1600&q=80",
    agency: "Vance Advisory",
    phone: "+1 (555) 010-3310",
    agencyId: "agency-a2",
  },
  {
    id: "a3",
    name: "Sofia Rahman",
    email: "sofia@estate-elite.local",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=1600&q=80",
    agency: "Rahman Estates",
    phone: "+1 (555) 010-4488",
    agencyId: "agency-a3",
  },
] as const;

function requireMock(id: string) {
  const property = MOCK_PROPERTIES.find((item) => item.id === id);
  if (!property) throw new Error(`Seed references missing listing ${id}.`);
  return property;
}

function prepareCatalog() {
  if (!(LISTING_LIMIT_STATUSES as readonly string[]).includes(SEEDED_LISTING_STATUS)) {
    throw new Error(`Seeded listing status ${SEEDED_LISTING_STATUS} does not count toward plan caps.`);
  }
  if (planIdForListingCount(FREE_LISTING_LIMIT) !== null) {
    throw new Error("The free listing cap must not require a paid plan.");
  }

  const aboveFree = FREE_LISTING_LIMIT + 1;
  const paid = planIdForListingCount(aboveFree);
  const chosen = SUBSCRIPTION_PLANS.find((plan) => plan.id === paid);
  const chosenCap = chosen ? planListingCap(chosen.listingLimit) : 0;
  if (!paid || (chosenCap != null && chosenCap < aboveFree)) {
    throw new Error("Listings above the free cap need a paid plan that can hold them.");
  }
  for (const plan of SUBSCRIPTION_PLANS) {
    const cap = planListingCap(plan.listingLimit);
    if (plan.id === paid || cap == null || chosenCap == null) continue;
    if (cap >= aboveFree && cap < chosenCap) {
      throw new Error(`Plan picker chose ${paid} over smaller plan ${plan.id}.`);
    }
  }

  const knownAgents = new Set<string>(agents.map((agent) => agent.id));
  const counts = new Map<string, number>();
  for (const property of MOCK_PROPERTIES) {
    if (!knownAgents.has(property.agentId)) {
      throw new Error(
        `Listing ${property.id} is assigned to ${property.agentId}, who is not a seeded agency user.`
      );
    }
    counts.set(property.agentId, (counts.get(property.agentId) ?? 0) + 1);
  }

  for (const agent of agents) {
    planIdForListingCount(counts.get(agent.id) ?? 0);
  }
  if (1 > SELLER_FREE_LISTING_LIMIT) {
    throw new Error(`Seller seed has 1 listing; cap is ${SELLER_FREE_LISTING_LIMIT}.`);
  }

  const pendingListing = requireMock("1");
  const confirmedListing = requireMock("12");
  const confirmedHost = agents.find((agent) => agent.id === confirmedListing.agentId);
  if (!confirmedHost) {
    throw new Error(`No seeded agency user for listing ${confirmedListing.id}.`);
  }

  return { counts, pendingListing, confirmedListing, confirmedHost };
}

/** Drop demo rows first so a second run cannot leave listings past the current caps. */
async function clearDatabase() {
  await prisma.$transaction(
    [
      prisma.bookingEvent.deleteMany(),
      prisma.booking.deleteMany(),
      prisma.leadMessage.deleteMany(),
      prisma.lead.deleteMany(),
      prisma.wishlistItem.deleteMany(),
      prisma.propertyViewDaily.deleteMany(),
      prisma.availabilityWindow.deleteMany(),
      prisma.propertyImage.deleteMany(),
      prisma.notification.deleteMany(),
      prisma.property.deleteMany(),
      prisma.subscription.deleteMany(),
      prisma.agentCredential.deleteMany(),
      prisma.agencyMember.deleteMany(),
      prisma.agency.deleteMany(),
      prisma.sellerProfile.deleteMany(),
      prisma.brokerProfile.deleteMany(),
      prisma.session.deleteMany(),
      prisma.account.deleteMany(),
      prisma.verificationToken.deleteMany(),
      prisma.user.deleteMany(),
      prisma.contactMessage.deleteMany(),
      prisma.blogPost.deleteMany(),
      prisma.faqItem.deleteMany(),
      prisma.adminSetting.deleteMany(),
      prisma.plan.deleteMany(),
    ]
  );
}

async function assertSeedMatchesRules() {
  const plans = await prisma.plan.findMany();
  if (plans.length !== SUBSCRIPTION_PLANS.length) {
    throw new Error(`Expected ${SUBSCRIPTION_PLANS.length} plans, found ${plans.length}.`);
  }
  for (const plan of SUBSCRIPTION_PLANS) {
    const row = plans.find((item) => item.id === plan.id);
    const expected = planListingCap(plan.listingLimit);
    if (!row || row.listingLimit !== expected) {
      throw new Error(`Plan ${plan.id} listing limit does not match the catalog.`);
    }
  }

  const agencies = await prisma.agency.findMany({
    include: { credentials: true, members: true },
  });
  const subscriptions = await prisma.subscription.findMany({
    where: { status: { in: [...ACTIVE_SUBSCRIPTION_STATUSES] } },
    include: { plan: true },
  });

  for (const agency of agencies) {
    const subs = subscriptions.filter((sub) => sub.agencyId === agency.id);
    if (subs.length > 1) {
      throw new Error(`Agency ${agency.id} has ${subs.length} active subscriptions.`);
    }
    const used = await prisma.property.count({
      where: { agencyId: agency.id, status: { in: [...LISTING_LIMIT_STATUSES] } },
    });
    const limit = subs[0] ? subs[0].plan.listingLimit : FREE_LISTING_LIMIT;
    if (limit != null && used > limit) {
      throw new Error(`Agency ${agency.id} has ${used} listings; cap is ${limit}.`);
    }
    const expectedPlan = planIdForListingCount(used);
    if ((subs[0]?.planId ?? null) !== expectedPlan) {
      throw new Error(
        `Agency ${agency.id} is on ${subs[0]?.planId ?? "free"} but ${used} listings require ${expectedPlan ?? "free"}.`
      );
    }
    if (agency.members.filter((member) => member.role === "owner").length !== 1) {
      throw new Error(`Agency ${agency.id} must have one owner.`);
    }
    if (agency.status === "active") {
      for (const type of requiredCredentialTypes(agency.country, agency.type)) {
        const row = agency.credentials.find((credential) => credential.type === type);
        if (!row?.value && !row?.fileUrl) {
          throw new Error(`Active agency ${agency.id} is missing ${type}.`);
        }
        if (row.status !== "approved") {
          throw new Error(`Active agency ${agency.id} has unapproved ${type}.`);
        }
      }
    }
  }

  const sellers = await prisma.user.findMany({
    where: { role: "SELLER" },
    include: { sellerProfile: true },
  });
  for (const seller of sellers) {
    if (seller.sellerProfile?.status !== "active") {
      throw new Error(`Seller ${seller.email} must be active to keep published listings.`);
    }
    const used = await prisma.property.count({
      where: { sellerId: seller.id, status: { in: [...LISTING_LIMIT_STATUSES] } },
    });
    if (used > SELLER_FREE_LISTING_LIMIT) {
      throw new Error(`Seller ${seller.email} has ${used} listings; cap is ${SELLER_FREE_LISTING_LIMIT}.`);
    }
  }

  const users = await prisma.user.findMany({
    include: { membership: true, sellerProfile: true, brokerProfile: true },
  });
  for (const user of users) {
    if ((user.role === "AGENCY") !== Boolean(user.membership)) {
      throw new Error(`${user.email} agency membership does not match role ${user.role}.`);
    }
    if ((user.role === "SELLER") !== Boolean(user.sellerProfile)) {
      throw new Error(`${user.email} seller profile does not match role ${user.role}.`);
    }
    if ((user.role === "BROKER") !== Boolean(user.brokerProfile)) {
      throw new Error(`${user.email} broker profile does not match role ${user.role}.`);
    }
    if (user.role === "BROKER" && user.brokerProfile?.status !== "active") {
      throw new Error(`Broker ${user.email} must be active to take seller viewings.`);
    }
  }

  const agencyListings = await prisma.property.findMany({
    where: { agencyId: { not: null } },
    select: { id: true, agencyId: true, agentId: true, sellerId: true },
  });
  const memberKeys = new Set(
    (
      await prisma.agencyMember.findMany({ select: { agencyId: true, userId: true } })
    ).map((member) => `${member.agencyId}:${member.userId}`)
  );
  for (const listing of agencyListings) {
    if (listing.sellerId) throw new Error(`Listing ${listing.id} has two owners.`);
    if (!memberKeys.has(`${listing.agencyId}:${listing.agentId}`)) {
      throw new Error(`Listing ${listing.id} contact is not a member of its agency.`);
    }
  }

  const sellerListings = await prisma.property.findMany({
    where: { sellerId: { not: null } },
    select: { id: true, sellerId: true, agentId: true, agencyId: true },
  });
  for (const listing of sellerListings) {
    if (listing.agencyId) throw new Error(`Listing ${listing.id} has two owners.`);
    if (listing.agentId !== listing.sellerId) {
      throw new Error(`Seller listing ${listing.id} must use the seller as the contact.`);
    }
  }

  const orphanCount = await prisma.property.count({
    where: { agencyId: null, sellerId: null },
  });
  if (orphanCount) throw new Error(`${orphanCount} listings have no owner.`);

  const brokerIds = users.filter((user) => user.role === "BROKER").map((user) => user.id);
  if (brokerIds.length) {
    const brokerListings = await prisma.property.count({
      where: { OR: [{ agentId: { in: brokerIds } }, { sellerId: { in: brokerIds } }] },
    });
    if (brokerListings) throw new Error("Brokers must not own or manage listings.");
  }

  const storedKeys = new Set((await prisma.adminSetting.findMany()).map((row) => row.key));
  const expectedKeys = new Set<string>(ADMIN_SETTINGS.map((setting) => setting.key));
  for (const key of expectedKeys) {
    if (!storedKeys.has(key)) throw new Error(`Missing admin setting ${key}.`);
  }
  for (const key of storedKeys) {
    if (!expectedKeys.has(key)) throw new Error(`Unknown admin setting ${key}.`);
  }
}

async function main() {
  const catalog = prepareCatalog();
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);
  const requiredCredentials = requiredCredentialTypes(AGENCY_COUNTRY, AGENCY_TYPE);

  await clearDatabase();

  for (const plan of SUBSCRIPTION_PLANS) {
    await prisma.plan.create({
      data: {
        id: plan.id,
        name: plan.name,
        description: plan.description,
        priceMonthly: plan.priceMonthly,
        listingLimit: planListingCap(plan.listingLimit),
        features: plan.features,
        highlighted: Boolean(plan.highlighted),
      },
    });
  }

  const admin = await prisma.user.create({
    data: {
      id: "admin",
      name: "Estate Admin",
      email: "admin@estate-elite.local",
      passwordHash,
      role: "ADMIN",
      emailVerified: REVIEWED_AT,
    },
  });

  const guest = await prisma.user.create({
    data: {
      id: "guest",
      name: "Guest Buyer",
      email: "guest@estate-elite.local",
      passwordHash,
      role: "USER",
      emailVerified: REVIEWED_AT,
    },
  });

  const seller = await prisma.user.create({
    data: {
      id: "seller1",
      name: "Nadia Khan",
      email: SELLER_EMAIL,
      passwordHash,
      role: "SELLER",
      emailVerified: REVIEWED_AT,
      sellerProfile: {
        create: {
          phone: "+92 300 555 0100",
          country: "PK",
          city: "Lahore",
          bio: "Owner listing a family home in DHA.",
          status: "active",
          onboardingStep: 2,
          submittedAt: REVIEWED_AT,
          reviewedAt: REVIEWED_AT,
        },
      },
    },
  });

  for (const agent of agents) {
    const listingCount = catalog.counts.get(agent.id) ?? 0;
    const planId = planIdForListingCount(listingCount);

    await prisma.user.create({
      data: {
        id: agent.id,
        name: agent.name,
        email: agent.email,
        image: agent.image,
        passwordHash,
        role: "AGENCY",
        emailVerified: REVIEWED_AT,
        membership: {
          create: {
            agency: {
              create: {
                id: agent.agencyId,
                name: agent.agency,
                phone: agent.phone,
                bio: "Represents institutional and private clients with a focus on discreet transactions, media-forward listings, and white-glove visit planning.",
                type: AGENCY_TYPE,
                country: AGENCY_COUNTRY,
                city: "Lahore",
                markets: ["Lahore", "Islamabad"],
                status: "active",
                onboardingStep: 5,
                standardsAcceptedAt: REVIEWED_AT,
                submittedAt: REVIEWED_AT,
                reviewedAt: REVIEWED_AT,
                reviewedById: admin.id,
                credentials: {
                  create: requiredCredentials.map((type) => ({
                    type,
                    value: `${type}-${agent.id}`,
                    status: "approved" as const,
                    jurisdiction: AGENCY_COUNTRY,
                  })),
                },
                subscriptions: planId
                  ? {
                      create: {
                        id: `sub-${agent.agencyId}`,
                        planId,
                        status: "active",
                        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                      },
                    }
                  : undefined,
              },
            },
            role: "owner",
            title: "Principal",
            languages: ["English", "Urdu"],
          },
        },
      },
    });
  }

  const broker = await prisma.user.create({
    data: {
      id: "broker1",
      name: "Omar Malik",
      email: "broker@estate-elite.local",
      passwordHash,
      role: "BROKER",
      emailVerified: REVIEWED_AT,
      brokerProfile: {
        create: {
          phone: "+92 300 555 0200",
          country: "PK",
          city: "Karachi",
          title: "Platform broker",
          bio: "Handles buyer questions and viewings for seller-owned listings.",
          status: "active",
          onboardingStep: 2,
          submittedAt: REVIEWED_AT,
          reviewedAt: REVIEWED_AT,
        },
      },
    },
  });

  const agencyIdByAgent = new Map(agents.map((agent) => [agent.id, agent.agencyId]));
  for (const property of MOCK_PROPERTIES) {
    const agencyId = agencyIdByAgent.get(property.agentId as (typeof agents)[number]["id"]);
    if (!agencyId) throw new Error(`No agency for listing ${property.id}.`);
    await prisma.property.create({
      data: {
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
        status: SEEDED_LISTING_STATUS,
        agentId: property.agentId,
        agencyId,
        sellerId: null,
        images: {
          create: [
            { url: property.image, sortOrder: 0, isCover: true },
            ...property.gallery.map((url, index) => ({
              url,
              sortOrder: index + 1,
              isCover: false,
            })),
          ],
        },
      },
    });
  }

  const sellerWindows = [
    { start: inDays(3, 10), end: inDays(3, 13), durationMin: 30, bufferMin: 15, timezone: "Asia/Karachi" },
    { start: inDays(5, 16), end: inDays(5, 18), durationMin: 30, bufferMin: 15, timezone: "Asia/Karachi" },
    { start: inDays(8, 11), end: inDays(8, 13), durationMin: 30, bufferMin: 15, timezone: "Asia/Karachi" },
  ];
  await prisma.property.create({
    data: {
      id: "seller-home-1",
      slug: "dha-family-home-karachi",
      title: "DHA Family Home — Karachi",
      description:
        "A corner family house with a lawn, generator, and a quiet street. Owner-listed; viewings go through the platform after both sides agree a time.",
      address: "Street 8, Phase 6, DHA",
      city: "Karachi",
      country: "Pakistan",
      price: 185000,
      purpose: "sale",
      bedrooms: 4,
      bathrooms: 4,
      areaSqm: 280,
      categories: ["home", "family"],
      amenities: ["Lawn", "Generator", "Parking"],
      badges: ["New"],
      furnished: false,
      status: SEEDED_LISTING_STATUS,
      sellerId: seller.id,
      agentId: seller.id,
      agencyId: null,
      availableSlots: generateAllSlots(sellerWindows),
      availabilityWindows: { create: sellerWindows },
      images: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80",
            sortOrder: 0,
            isCover: true,
          },
        ],
      },
    },
  });

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
  await prisma.faqItem.createMany({
    data: faqs.map((faq) => ({ ...faq, published: true })),
  });

  await prisma.blogPost.createMany({
    data: [
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
    ],
  });

  const defaultOn = new Set<string>(ADMIN_SETTINGS_DEFAULT_ON);
  await prisma.adminSetting.createMany({
    data: ADMIN_SETTINGS.map((setting) => ({
      key: setting.key,
      value: defaultOn.has(setting.key),
    })),
  });

  // Slots stay in the future so the demo viewings remain bookable after each seed.
  await prisma.booking.create({
    data: {
      id: "BR-1024",
      propertyId: catalog.pendingListing.id,
      userId: guest.id,
      name: guest.name ?? "Guest Buyer",
      email: guest.email ?? "guest@estate-elite.local",
      phone: "+1 (555) 010-1000",
      notes: "Looking for a marina-facing penthouse for a family relocation.",
      status: "pending",
      timezone: "Asia/Dubai",
      partySize: 2,
      slots: [inDays(3, 9), inDays(4, 10), inDays(5, 11)],
      events: {
        create: { status: "pending", actorRole: "buyer", note: "Viewing requested" },
      },
    },
  });

  await prisma.booking.create({
    data: {
      id: "BR-1021",
      propertyId: catalog.confirmedListing.id,
      userId: guest.id,
      name: guest.name ?? "Guest Buyer",
      email: guest.email ?? "guest@estate-elite.local",
      phone: "+1 (555) 010-1000",
      notes: "Short-stay due diligence before a 60-night lease.",
      status: "confirmed",
      timezone: "Asia/Dubai",
      slots: [inDays(7, 16)],
      visitDate: inDays(7, 16),
      events: {
        create: [
          { status: "pending", actorRole: "buyer", note: "Viewing requested" },
          {
            status: "confirmed",
            actorRole: "host",
            note: `Ask for ${catalog.confirmedHost.name.split(" ")[0]} at reception.`,
          },
        ],
      },
    },
  });

  await prisma.booking.create({
    data: {
      id: "BR-S1",
      propertyId: "seller-home-1",
      userId: guest.id,
      name: guest.name ?? "Guest Buyer",
      email: guest.email ?? "guest@estate-elite.local",
      phone: "+1 (555) 010-1000",
      notes: "Family of four, weekday evenings if possible.",
      status: "pending",
      timezone: "Asia/Karachi",
      partySize: 3,
      slots: [inDays(3, 10)],
      visitDate: inDays(3, 10),
      visitDurationMin: 30,
      visitEnd: new Date(inDays(3, 10).valueOf() + 30 * 60_000),
      buyerAcceptedAt: new Date(),
      events: {
        create: { status: "pending", actorRole: "buyer", note: "Picked an owner-posted time" },
      },
    },
  });

  await prisma.booking.create({
    data: {
      id: "BR-S2",
      propertyId: "seller-home-1",
      userId: guest.id,
      name: guest.name ?? "Guest Buyer",
      email: guest.email ?? "guest@estate-elite.local",
      phone: "+1 (555) 010-1000",
      notes: "Both sides already agreed this window.",
      status: "pending_admin",
      timezone: "Asia/Karachi",
      partySize: 2,
      slots: [inDays(5, 16)],
      visitDate: inDays(5, 16),
      visitDurationMin: 30,
      visitEnd: new Date(inDays(5, 16).valueOf() + 30 * 60_000),
      buyerAcceptedAt: new Date(),
      sellerAcceptedAt: new Date(),
      events: {
        create: [
          { status: "pending", actorRole: "buyer", note: "Picked an owner-posted time" },
          { status: "pending_admin", actorRole: "host", note: "Owner agreed — sent to platform" },
        ],
      },
    },
  });

  await prisma.booking.create({
    data: {
      id: "BR-S3",
      propertyId: "seller-home-1",
      userId: guest.id,
      name: guest.name ?? "Guest Buyer",
      email: guest.email ?? "guest@estate-elite.local",
      phone: "+1 (555) 010-1000",
      notes: "Platform confirmed this time and assigned a city broker.",
      status: "confirmed",
      timezone: "Asia/Karachi",
      partySize: 2,
      slots: [inDays(8, 11)],
      visitDate: inDays(8, 11),
      visitDurationMin: 30,
      visitEnd: new Date(inDays(8, 11).valueOf() + 30 * 60_000),
      buyerAcceptedAt: new Date(),
      sellerAcceptedAt: new Date(),
      assignedBrokerId: broker.id,
      events: {
        create: [
          { status: "pending", actorRole: "buyer", note: "Picked an owner-posted time" },
          { status: "pending_admin", actorRole: "host", note: "Owner agreed — sent to platform" },
          { status: "confirmed", actorRole: "admin", note: "Assigned to Omar Malik." },
        ],
      },
    },
  });

  await prisma.notification.createMany({
    data: [
      {
        id: "n1",
        userId: guest.id,
        title: "Viewing confirmed",
        body: `Your viewing of ${catalog.confirmedListing.title} is confirmed.`,
        href: "/dashboard/viewings/BR-1021",
      },
      {
        id: "n2",
        userId: guest.id,
        title: "Document vault ready",
        body: `HOA pack and floor plans are available for ${catalog.confirmedListing.title}.`,
        href: "/dashboard/viewings",
      },
    ],
  });

  await assertSeedMatchesRules();

  console.log("Seed complete.");
  console.log(`  Admin    admin@estate-elite.local / ${SEED_PASSWORD}`);
  console.log(`  Buyer    guest@estate-elite.local / ${SEED_PASSWORD}`);
  console.log(`  Seller   ${SELLER_EMAIL} / ${SEED_PASSWORD} (${SELLER_FREE_LISTING_LIMIT} listing cap)`);
  console.log(`  Broker   broker@estate-elite.local / ${SEED_PASSWORD}`);
  for (const agent of agents) {
    const count = catalog.counts.get(agent.id) ?? 0;
    console.log(
      `  Agency   ${agent.email} / ${SEED_PASSWORD} (${planIdForListingCount(count) ?? "free"}, ${count} listings)`
    );
  }
  console.log(`  Users: admin=${admin.id} seller=${seller.id} broker=${broker.id}`);
}

function inDays(days: number, hour: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCHours(hour, 0, 0, 0);
  return date;
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
