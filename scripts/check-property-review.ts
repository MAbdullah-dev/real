/**
 * Property review transitions, reasons, auth, and public visibility.
 * Run: npx dotenv -e .env -o -- tsx scripts/check-property-review.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

import { moderatePropertyAs, resubmitPropertyAs } from "../src/server/property-review-apply";
import {
  PUBLIC_LISTING_STATUS,
  adminTransition,
  isPublicListingStatus,
  nextStatusOnSave,
  reasonError,
  resubmitBlockReason,
  reviewNotification,
  submittedListingStatus,
} from "../src/server/property-review";

function denies(from: "draft" | "pending_review" | "published" | "rejected", to: "pending_review" | "published" | "rejected") {
  const result = adminTransition(from, to);
  assert.ok("error" in result, `${from} → ${to} should be refused`);
}

assert.deepEqual(adminTransition("pending_review", "published"), { action: "approved" });
assert.deepEqual(adminTransition("pending_review", "rejected"), { action: "rejected" });
assert.deepEqual(adminTransition("published", "pending_review"), { action: "unpublished" });
denies("rejected", "published");
denies("draft", "published");
denies("published", "rejected");
denies("rejected", "pending_review");
denies("draft", "rejected");

assert.equal(reasonError("rejected", "  "), "A reason is required.");
assert.equal(reasonError("unpublished", ""), "A reason is required.");
assert.equal(reasonError("rejected", "Images are too low quality"), null);
assert.equal(reasonError("approved", ""), null);
assert.match(reviewNotification("rejected", "Clearer photos").body, /Clearer photos/);
assert.match(reviewNotification("unpublished", "Verify the address").body, /Verify the address/);
assert.equal(reviewNotification("approved", "").title, "Property Approved");

assert.equal(nextStatusOnSave("rejected", "published", true), "rejected");
assert.equal(nextStatusOnSave("rejected", "draft", false), "rejected");
assert.equal(nextStatusOnSave("pending_review", "published", false), "pending_review");
assert.equal(nextStatusOnSave("pending_review", "published", true), "published");
assert.equal(nextStatusOnSave("draft", "published", false), "pending_review");
assert.equal(nextStatusOnSave("published", "published", false), "published");
assert.equal(submittedListingStatus("published", false), "pending_review");
assert.equal(submittedListingStatus("pending_review", false), "pending_review");
assert.equal(submittedListingStatus("draft", false), "draft");
assert.equal(submittedListingStatus("published", true), "published");
assert.equal(submittedListingStatus("rejected", false), "draft");

const own = { status: "rejected", sellerId: "seller-1", agencyId: null };
assert.equal(resubmitBlockReason({ role: "USER", userId: "seller-1" }, own), "You can only resubmit your own listings.");
assert.equal(
  resubmitBlockReason({ role: "SELLER", userId: "other", accountStatus: "active" }, own),
  "You can only resubmit your own listings."
);
assert.equal(
  resubmitBlockReason({ role: "SELLER", userId: "seller-1", accountStatus: "pending_review" }, own),
  "Your account must be approved before you can request review."
);
assert.equal(
  resubmitBlockReason({ role: "SELLER", userId: "seller-1", accountStatus: "active" }, own),
  null
);
assert.equal(
  resubmitBlockReason(
    { role: "SELLER", userId: "seller-1", accountStatus: "active" },
    { status: "published", sellerId: "seller-1", agencyId: null }
  ),
  "Only rejected listings can be resubmitted."
);
assert.equal(
  resubmitBlockReason({ role: "ADMIN", userId: "admin-1" }, own),
  "You can only resubmit your own listings."
);

assert.equal(isPublicListingStatus("published"), true);
assert.equal(isPublicListingStatus("pending_review"), false);
assert.equal(isPublicListingStatus("rejected"), false);
assert.equal(isPublicListingStatus("draft"), false);
assert.equal(PUBLIC_LISTING_STATUS, "published");

for (const file of [
  "src/server/properties.ts",
  "src/server/actions/leads.ts",
  "src/server/actions/bookings.ts",
  "src/server/actions/wishlist.ts",
  "src/server/agents.ts",
]) {
  const text = readFileSync(path.join(process.cwd(), file), "utf8");
  assert.ok(
    text.includes("PUBLIC_LISTING_STATUS") || text.includes("isPublicListingStatus"),
    `${file} must use the public listing gate`
  );
  assert.equal(text.includes('status: "published"'), false, file);
  assert.equal(text.includes('status !== "published"'), false, file);
}

async function main() {
const prisma = new PrismaClient();
const token = `review-check-${Date.now()}`;
const started = new Date();
let propertyId: string | null = null;
let cycleId: string | null = null;
let raceId: string | null = null;
let agentId: string | null = null;

try {
  const user = await prisma.user.findFirst({ select: { id: true } });
  assert.ok(user, "need a user to attach the temporary listing");
  agentId = user.id;

  const property = await prisma.property.create({
    data: {
      slug: token,
      title: `Review check ${token}`,
      description: "Temporary listing for the review workflow check.",
      address: "1 Check Street",
      city: "Check City",
      country: "Checkland",
      price: 1000,
      purpose: "sale",
      bedrooms: 1,
      bathrooms: 1,
      areaSqm: 40,
      status: "draft",
      agentId: user.id,
    },
    select: { id: true },
  });
  propertyId = property.id;

  const queued = submittedListingStatus("published", false);
  assert.equal(queued, "pending_review");
  await prisma.property.update({ where: { id: property.id }, data: { status: queued } });
  assert.equal(
    await prisma.property.count({ where: { id: property.id, status: PUBLIC_LISTING_STATUS } }),
    0
  );

  const denied = await moderatePropertyAs(prisma, { role: "SELLER", userId: user.id }, {
    id: property.id,
    status: "published",
  });
  assert.equal("error" in denied && denied.error, "Only admins can review listings.");

  const blank = await moderatePropertyAs(prisma, { role: "ADMIN", userId: user.id }, {
    id: property.id,
    status: "rejected",
    reason: "   ",
  });
  assert.equal("error" in blank && blank.error, "A reason is required.");
  assert.equal((await prisma.property.findUnique({ where: { id: property.id } }))?.status, "pending_review");
  assert.equal(await prisma.propertyReviewAction.count({ where: { propertyId: property.id } }), 0);

  const notRejectedYet = await resubmitPropertyAs(prisma, property.id);
  assert.equal("error" in notRejectedYet && notRejectedYet.error, "Only rejected listings can be resubmitted.");

  const rejected = await moderatePropertyAs(prisma, { role: "ADMIN", userId: user.id }, {
    id: property.id,
    status: "rejected",
    reason: `Images are too low quality ${token}`,
  });
  assert.equal("ok" in rejected && rejected.ok, true);
  assert.equal((await prisma.property.findUnique({ where: { id: property.id } }))?.status, "rejected");

  const edited = nextStatusOnSave("rejected", "published", true);
  await prisma.property.update({
    where: { id: property.id },
    data: { description: `Fixed ${token}`, status: edited },
  });
  const afterEdit = await prisma.property.findUnique({
    where: { id: property.id },
    select: { status: true, description: true },
  });
  assert.equal(afterEdit?.status, "rejected");
  assert.equal(afterEdit?.description, `Fixed ${token}`);

  const skipReview = await moderatePropertyAs(prisma, { role: "ADMIN", userId: user.id }, {
    id: property.id,
    status: "published",
  });
  assert.equal("error" in skipReview && skipReview.error, "That status change is not allowed.");

  const early = await resubmitPropertyAs(prisma, property.id);
  assert.equal("ok" in early && early.ok, true);
  assert.equal((await prisma.property.findUnique({ where: { id: property.id } }))?.status, "pending_review");

  const approved = await moderatePropertyAs(prisma, { role: "ADMIN", userId: user.id }, {
    id: property.id,
    status: "published",
  });
  assert.equal("ok" in approved && approved.ok, true);
  assert.equal(
    await prisma.property.count({ where: { id: property.id, status: PUBLIC_LISTING_STATUS } }),
    1
  );

  const rejectLive = await moderatePropertyAs(prisma, { role: "ADMIN", userId: user.id }, {
    id: property.id,
    status: "rejected",
    reason: "Should not apply",
  });
  assert.equal("error" in rejectLive && rejectLive.error, "That status change is not allowed.");
  assert.equal((await prisma.property.findUnique({ where: { id: property.id } }))?.status, "published");

  const blankOffline = await moderatePropertyAs(prisma, { role: "ADMIN", userId: user.id }, {
    id: property.id,
    status: "pending_review",
    reason: " ",
  });
  assert.equal("error" in blankOffline && blankOffline.error, "A reason is required.");
  assert.equal((await prisma.property.findUnique({ where: { id: property.id } }))?.status, "published");

  const offline = await moderatePropertyAs(prisma, { role: "ADMIN", userId: user.id }, {
    id: property.id,
    status: "pending_review",
    reason: `Verify the address ${token}`,
  });
  assert.equal("ok" in offline && offline.ok, true);
  assert.equal((await prisma.property.findUnique({ where: { id: property.id } }))?.status, "pending_review");
  assert.equal(
    await prisma.property.count({ where: { id: property.id, status: PUBLIC_LISTING_STATUS } }),
    0
  );

  const history = await prisma.propertyReviewAction.findMany({
    where: { propertyId: property.id },
    orderBy: { createdAt: "asc" },
    select: { action: true, reason: true, adminId: true },
  });
  assert.deepEqual(
    history.map((row) => row.action),
    ["rejected", "resubmitted", "approved", "unpublished"]
  );
  assert.equal(history[0]?.reason, `Images are too low quality ${token}`);
  assert.equal(history[1]?.adminId, null);
  assert.equal(history[3]?.reason, `Verify the address ${token}`);

  const republished = await moderatePropertyAs(prisma, { role: "ADMIN", userId: user.id }, {
    id: property.id,
    status: "published",
  });
  assert.equal("ok" in republished && republished.ok, true);
  assert.equal(
    await prisma.property.count({ where: { id: property.id, status: PUBLIC_LISTING_STATUS } }),
    1
  );
  const afterRepublish = await prisma.propertyReviewAction.findMany({
    where: { propertyId: property.id },
    orderBy: { createdAt: "asc" },
    select: { action: true },
  });
  assert.deepEqual(
    afterRepublish.map((row) => row.action),
    ["rejected", "resubmitted", "approved", "unpublished", "approved"]
  );

  const cycle = await prisma.property.create({
    data: {
      slug: `${token}-cycle`,
      title: `Review cycle ${token}`,
      description: "Temporary listing for the publish lifecycle check.",
      address: "3 Check Street",
      city: "Check City",
      country: "Checkland",
      price: 1000,
      purpose: "sale",
      bedrooms: 1,
      bathrooms: 1,
      areaSqm: 40,
      status: "draft",
      agentId: user.id,
    },
    select: { id: true },
  });
  cycleId = cycle.id;
  await prisma.property.update({
    where: { id: cycle.id },
    data: { status: submittedListingStatus("pending_review", false) },
  });
  assert.equal((await prisma.property.findUnique({ where: { id: cycle.id } }))?.status, "pending_review");
  assert.equal("ok" in (await moderatePropertyAs(prisma, { role: "ADMIN", userId: user.id }, { id: cycle.id, status: "published" })) && true, true);
  assert.equal(await prisma.property.count({ where: { id: cycle.id, status: PUBLIC_LISTING_STATUS } }), 1);
  const cycleOffline = await moderatePropertyAs(prisma, { role: "ADMIN", userId: user.id }, {
    id: cycle.id,
    status: "pending_review",
    reason: `Cycle offline ${token}`,
  });
  assert.equal("ok" in cycleOffline && cycleOffline.ok, true);
  assert.equal(await prisma.property.count({ where: { id: cycle.id, status: PUBLIC_LISTING_STATUS } }), 0);
  const cycleLive = await moderatePropertyAs(prisma, { role: "ADMIN", userId: user.id }, { id: cycle.id, status: "published" });
  assert.equal("ok" in cycleLive && cycleLive.ok, true);
  assert.equal(await prisma.property.count({ where: { id: cycle.id, status: PUBLIC_LISTING_STATUS } }), 1);
  assert.deepEqual(
    (await prisma.propertyReviewAction.findMany({
      where: { propertyId: cycle.id },
      orderBy: { createdAt: "asc" },
      select: { action: true },
    })).map((row) => row.action),
    ["approved", "unpublished", "approved"]
  );

  const race = await prisma.property.create({
    data: {
      slug: `${token}-race`,
      title: `Review race ${token}`,
      description: "Temporary listing for the concurrent review check.",
      address: "2 Check Street",
      city: "Check City",
      country: "Checkland",
      price: 1000,
      purpose: "sale",
      bedrooms: 1,
      bathrooms: 1,
      areaSqm: 40,
      status: "pending_review",
      agentId: user.id,
    },
    select: { id: true },
  });
  raceId = race.id;
  const [first, second] = await Promise.all([
    moderatePropertyAs(prisma, { role: "ADMIN", userId: user.id }, { id: race.id, status: "published" }),
    moderatePropertyAs(prisma, { role: "ADMIN", userId: user.id }, { id: race.id, status: "published" }),
  ]);
  const wins = [first, second].filter((result) => "ok" in result && result.ok);
  assert.equal(wins.length, 1);
  assert.equal(await prisma.propertyReviewAction.count({ where: { propertyId: race.id } }), 1);
  assert.equal(
    await prisma.notification.count({
      where: { href: `/agency/properties/${race.id}/edit`, title: "Property Approved" },
    }),
    1
  );
  const notes = await prisma.notification.findMany({
    where: { userId: user.id, createdAt: { gte: started } },
    select: { title: true, body: true },
  });
  const titles = notes.map((note) => note.title);
  for (const title of ["Property Rejected", "Property Resubmitted", "Property Approved", "Property Unpublished"]) {
    assert.ok(titles.includes(title), `missing notification ${title}`);
  }
  assert.match(notes.find((note) => note.title === "Property Rejected")?.body ?? "", /Images are too low quality/);
  assert.match(notes.find((note) => note.title === "Property Unpublished")?.body ?? "", /Verify the address/);

  console.log("check-property-review: ok");
} finally {
  for (const id of [propertyId, cycleId, raceId]) {
    if (id) await prisma.property.delete({ where: { id } }).catch(() => undefined);
  }
  if (agentId) {
    await prisma.notification.deleteMany({
      where: {
        createdAt: { gte: started },
        OR: [
          { userId: agentId, title: { in: ["Property Rejected", "Property Resubmitted", "Property Approved", "Property Unpublished"] } },
          { title: "Property resubmitted for review", body: { contains: token } },
        ],
      },
    });
  }
  await prisma.$disconnect();
}
}

main();
