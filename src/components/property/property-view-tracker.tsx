import { connection } from "next/server";

import { recordPropertyView } from "@/server/analytics";

/** Renders nothing; increments the daily view rollup once per request. */
export async function PropertyViewTracker({ propertyId }: { propertyId: string }) {
  await connection();
  await recordPropertyView(propertyId);
  return null;
}
