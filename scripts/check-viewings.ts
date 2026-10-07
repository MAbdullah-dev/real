/**
 * Self-check for the viewing lifecycle rules. Run with:
 *   npx tsx scripts/check-viewings.ts
 * Fails loudly if slot validation or the state machine drifts.
 */
import assert from "node:assert/strict";

import { rateLimit } from "../src/lib/rate-limit";
import {
  MAX_AVAILABILITY,
  MAX_SLOTS,
  MIN_LEAD_HOURS,
  canAdminTransition,
  canHostTransition,
  canSellerTransition,
  formatInZone,
  isViewingOpen,
  parseAvailability,
  parseSlots,
  sameSlot,
  slotInList,
} from "../src/lib/viewings";

const NOW = Date.parse("2026-03-01T12:00:00Z");
const hours = (n: number) => new Date(NOW + n * 3_600_000).toISOString();
const days = (n: number) => new Date(NOW + n * 24 * 3_600_000).toISOString();

function ok<T>(result: T | { error: string }): T {
  assert.ok(!(result as { error?: string }).error, `unexpected error: ${JSON.stringify(result)}`);
  return result as T;
}

/* Slot validation ------------------------------------------------------- */

assert.equal(
  "error" in parseSlots([], NOW) ? "empty" : "",
  "empty",
  "no slots must be rejected"
);

assert.ok(
  "error" in parseSlots([hours(MIN_LEAD_HOURS - 1)], NOW),
  `a slot under ${MIN_LEAD_HOURS}h notice must be rejected`
);

assert.ok(
  !("error" in parseSlots([hours(MIN_LEAD_HOURS + 1)], NOW)),
  "a slot just past the notice window must be accepted"
);

assert.ok("error" in parseSlots([days(61)], NOW), "a slot beyond the horizon must be rejected");
assert.ok("error" in parseSlots(["not a date"], NOW), "garbage input must be rejected");

const deduped = ok(parseSlots([days(3), days(3), days(1)], NOW)).slots;
assert.equal(deduped.length, 2, "duplicate slots collapse");
assert.ok(deduped[0] < deduped[1], "slots come back in chronological order");

assert.ok(
  "error" in parseSlots([days(1), days(2), days(3), days(4)], NOW),
  `more than ${MAX_SLOTS} slots must be rejected`
);

const windows = ok(parseAvailability([days(1), days(2), days(3), days(4)], NOW)).slots;
assert.equal(windows.length, 4, `listing availability may hold up to ${MAX_AVAILABILITY} windows`);
assert.ok(slotInList(windows[0], windows), "posted times are findable");
assert.ok(sameSlot(windows[0], new Date(windows[0].valueOf() + 30_000)), "slots match within a minute");
assert.ok(!slotInList(new Date(windows[0].valueOf() + 120_000), windows), "a different minute is not the same window");

/* State machine --------------------------------------------------------- */

assert.ok(canHostTransition("pending", "confirmed"), "agency pending → confirmed");
assert.ok(canHostTransition("proposed", "confirmed"), "proposed → confirmed");
assert.ok(canHostTransition("confirmed", "completed"), "confirmed → completed");
assert.ok(canHostTransition("confirmed", "proposed"), "a host may move a confirmed time");

assert.ok(!canHostTransition("completed", "confirmed"), "completed is terminal");
assert.ok(!canHostTransition("cancelled", "confirmed"), "cancelled is terminal");
assert.ok(!canHostTransition("declined", "completed"), "declined cannot complete");
assert.ok(!canHostTransition("pending", "completed"), "a visit cannot complete before it happens");
assert.ok(
  !canHostTransition("pending", "pending_admin"),
  "agency hosts do not send viewings to the platform queue"
);

assert.ok(canSellerTransition("pending", "pending_admin"), "seller agrees → platform");
assert.ok(canSellerTransition("pending", "proposed"), "seller may send a new time to the buyer");
assert.ok(!canSellerTransition("pending", "confirmed"), "seller cannot self-confirm");
assert.ok(canSellerTransition("proposed", "pending_admin"), "seller may accept an admin offer back to platform");
assert.ok(canAdminTransition("pending_admin", "confirmed"), "admin accept");
assert.ok(canAdminTransition("pending_admin", "proposed"), "admin reschedule");
assert.ok(!canAdminTransition("pending", "confirmed"), "admin does not skip seller agreement");

assert.ok(
  isViewingOpen("pending") &&
    isViewingOpen("proposed") &&
    isViewingOpen("pending_admin") &&
    isViewingOpen("confirmed")
);
assert.ok(
  !isViewingOpen("declined") &&
    !isViewingOpen("cancelled") &&
    !isViewingOpen("completed") &&
    !isViewingOpen("no_show"),
  "terminal states are not open"
);

/* Timezone rendering ---------------------------------------------------- */

assert.equal(
  formatInZone("2026-03-01T12:00:00Z", "UTC", { hour: "numeric", timeZone: "UTC" }),
  formatInZone("2026-03-01T12:00:00Z", "Not/AZone", { hour: "numeric", timeZone: "UTC" }),
  "an invalid timezone falls back to UTC instead of throwing"
);

assert.notEqual(
  formatInZone("2026-03-01T12:00:00Z", "UTC"),
  formatInZone("2026-03-01T12:00:00Z", "Asia/Karachi"),
  "the stored zone actually shifts the rendered wall clock"
);

/* Rate limiting --------------------------------------------------------- */

const key = `check-${Math.random()}`;
for (let i = 0; i < 3; i += 1) {
  assert.ok(rateLimit(key, 3, 60_000).ok, `request ${i + 1} of 3 is allowed`);
}
const blocked = rateLimit(key, 3, 60_000);
assert.ok(!blocked.ok, "the fourth request in the window is blocked");
assert.ok(blocked.retryAfterMs > 0, "a blocked request reports when to retry");
assert.ok(rateLimit(`${key}-other`, 3, 60_000).ok, "limits are per key");

console.log("check-viewings: all assertions passed");
