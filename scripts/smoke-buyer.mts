/**
 * End-to-end smoke of the buyer journey against a running server.
 *   npm start   (in another terminal)
 *   npx tsx scripts/smoke-buyer.mts
 * Signs in as the seeded buyer and asserts every page of the flow renders the
 * state it is supposed to. Fails loudly on the first broken step.
 */
import assert from "node:assert/strict";

const BASE = process.env.SMOKE_BASE ?? "http://localhost:3000";
const EMAIL = "guest@estate-elite.local";
const PASSWORD = "Password123!";

let jar = new Map<string, string>();

function cookieHeader() {
  return [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function visit(path: string, init: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    redirect: "manual",
    headers: { ...(init.headers ?? {}), cookie: cookieHeader() },
  });
  for (const raw of res.headers.getSetCookie()) {
    const [pair] = raw.split(";");
    const index = pair.indexOf("=");
    if (index > 0) jar.set(pair.slice(0, index).trim(), pair.slice(index + 1).trim());
  }
  return res;
}

async function page(path: string) {
  const res = await visit(path);
  assert.equal(res.status, 200, `${path} returned ${res.status}`);
  return res.text();
}

function has(html: string, needle: string, where: string) {
  assert.ok(html.includes(needle), `${where} is missing "${needle}"`);
}

async function signIn(email: string) {
  jar = new Map();
  const { csrfToken } = (await (await visit("/api/auth/csrf")).json()) as { csrfToken: string };
  const res = await visit("/api/auth/callback/credentials", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ csrfToken, email, password: PASSWORD, redirect: "false" }),
  });
  assert.ok([200, 302].includes(res.status), `sign-in as ${email} returned ${res.status}`);
  const session = (await (await visit("/api/auth/session")).json()) as {
    user?: { email?: string };
  };
  assert.equal(session.user?.email, email, `the session cookie for ${email} did not stick`);
}

/* Anonymous discovery ---------------------------------------------------- */

const search = await page("/search?purpose=rent&sort=price_asc");
has(search, "Sort", "/search");

const empty = await page("/search?q=zzzzzzzznotathing");
has(empty, "No", "/search with no results");

const gate = await page("/booking/1");
has(gate, "Sign in to book", "/booking/1 while signed out");

/* Sign in ---------------------------------------------------------------- */

await signIn(EMAIL);

/* Signed-in buyer surfaces ----------------------------------------------- */

const booking = await page("/booking/1");
has(booking, "When works for you?", "/booking/1 while signed in");
has(booking, "Contact number", "/booking/1 while signed in");
assert.ok(!booking.includes("Sign in to book"), "/booking/1 still shows the sign-in gate");

for (const path of [
  "/dashboard",
  "/dashboard/viewings",
  "/dashboard/messages",
  "/dashboard/saved",
  "/dashboard/notifications",
  "/dashboard/settings",
  "/wishlist",
]) {
  const html = await page(path);
  assert.ok(!html.includes("Application error"), `${path} rendered an error boundary`);
}

/* Role boundaries -------------------------------------------------------- */

for (const path of ["/agency/viewings", "/broker/viewings", "/seller/viewings", "/admin"]) {
  const res = await visit(path);
  const body = res.status === 200 ? await res.text() : "";
  assert.ok(
    res.status !== 200 || !body.includes("Viewing requests"),
    `a buyer reached the host console at ${path}`
  );
}

/* The other half of the loop: the request lands in the host's inbox --------- */

const viewings = await page("/dashboard/viewings");
has(viewings, "BR-1024", "the buyer's viewing list");

const detail = await page("/dashboard/viewings/BR-1024");
has(detail, "Awaiting reply", "the viewing detail page");
has(detail, "Viewing requested", "the viewing detail timeline");

await signIn("amelia@estate-elite.local");

// PPR always serves the prerendered shell with a 200, so judge the body:
// another account must get the not-found branch, never the buyer's details.
const stolen = await visit("/dashboard/viewings/BR-1024");
const stolenBody = stolen.status === 200 ? await stolen.text() : "";
assert.ok(
  !stolenBody.includes("Guest Buyer") && !stolenBody.includes("Awaiting reply"),
  "another account saw the buyer's viewing"
);

const inbox = await page("/agency/viewings");
has(inbox, "BR-1024", "the agency viewing inbox");
has(inbox, "Guest Buyer", "the agency viewing inbox");

console.log("smoke-buyer: all assertions passed");
