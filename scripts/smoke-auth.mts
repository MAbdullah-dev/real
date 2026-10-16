/**
 * Session login/logout against a running Next server.
 * Run: npx tsx scripts/smoke-auth.mts
 */
const base = process.env.SMOKE_BASE ?? "http://localhost:3000";

function storeCookies(jar: Map<string, string>, res: Response) {
  const raw = res.headers.getSetCookie?.() ?? [];
  for (const c of raw) {
    const [pair] = c.split(";");
    const eq = pair.indexOf("=");
    if (eq > 0) jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1));
  }
}

function cookieHeader(jar: Map<string, string>) {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function req(jar: Map<string, string>, path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  const cookie = cookieHeader(jar);
  if (cookie) headers.set("Cookie", cookie);
  const res = await fetch(`${base}${path}`, { ...init, headers, redirect: "manual" });
  storeCookies(jar, res);
  return res;
}

async function signIn(jar: Map<string, string>, email: string, password: string) {
  const csrf = (await (await req(jar, "/api/auth/csrf")).json()) as { csrfToken: string };
  return req(jar, "/api/auth/callback/credentials", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Auth-Return-Redirect": "1",
    },
    body: new URLSearchParams({
      csrfToken: csrf.csrfToken,
      email,
      password,
      callbackUrl: `${base}/dashboard`,
      json: "true",
    }),
  });
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const jar = new Map<string, string>();

const dashAnon = await req(jar, "/dashboard");
assert(dashAnon.status === 307, `anon dashboard expected 307, got ${dashAnon.status}`);
assert(
  dashAnon.headers.get("location")?.includes("/auth/login"),
  "anon dashboard should send the user to login"
);

await signIn(jar, "guest@estate-elite.local", "Password123!");
const session = (await (await req(jar, "/api/auth/session")).json()) as {
  user?: { role?: string; email?: string };
};
assert(session?.user?.role === "USER", `expected USER session, got ${JSON.stringify(session)}`);
assert((await req(jar, "/dashboard")).status === 200, "signed-in dashboard should be 200");

const csrf = (await (await req(jar, "/api/auth/csrf")).json()) as { csrfToken: string };
await req(jar, "/api/auth/signout", {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    "X-Auth-Return-Redirect": "1",
  },
  body: new URLSearchParams({ csrfToken: csrf.csrfToken, callbackUrl: `${base}/`, json: "true" }),
});
const empty = await (await req(jar, "/api/auth/session")).json();
assert(empty === null || empty?.user == null, `session should be empty after sign-out, got ${JSON.stringify(empty)}`);
assert((await req(jar, "/dashboard")).status === 307, "signed-out dashboard should redirect");

console.log("smoke-auth: ok");
process.exit(0);
