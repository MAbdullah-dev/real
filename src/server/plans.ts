import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { toPlan } from "@/server/mappers";

export async function listPlans() {
  "use cache";
  cacheTag("plans");
  cacheLife("hours");

  const rows = await prisma.plan.findMany({
    orderBy: { priceMonthly: "asc" },
  });
  return rows.map(toPlan);
}

export async function getPlanById(id: string) {
  "use cache";
  cacheTag("plans", `plan-${id}`);
  cacheLife("hours");

  const row = await prisma.plan.findUnique({ where: { id } });
  return row ? toPlan(row) : undefined;
}
