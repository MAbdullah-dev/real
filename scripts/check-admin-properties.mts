/**
 * Ownership tabs for admin inventory must use agencyId/sellerId, not names.
 * Run: npx dotenv -e .env -o -- tsx scripts/check-admin-properties.mts
 */
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";

import { isAgencyOwned, isSellerOwned } from "../src/lib/listing-ownership";

const prisma = new PrismaClient();

const rows = await prisma.property.findMany({
  select: { id: true, status: true, agencyId: true, sellerId: true },
});

const agency = rows.filter((row) => isAgencyOwned(row));
const seller = rows.filter((row) => isSellerOwned(row));
const pending = rows.filter((row) => row.status === "pending_review");
const unknown = rows.filter((row) => !isAgencyOwned(row) && !isSellerOwned(row));

assert.equal(agency.length + seller.length + unknown.length, rows.length);
assert.ok(agency.every((row) => row.agencyId != null));
assert.ok(seller.every((row) => row.sellerId != null && row.agencyId == null));
assert.ok(pending.every((row) => row.status === "pending_review"));

console.log("check-admin-properties: ok", {
  all: rows.length,
  agency: agency.length,
  seller: seller.length,
  pending: pending.length,
  unknown: unknown.length,
});

await prisma.$disconnect();
