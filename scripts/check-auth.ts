/**
 * Self-check for callback-URL sanitizing and Auth.js error detection.
 * Run: npx tsx scripts/check-auth.ts
 */
import assert from "node:assert/strict";

import { safeCallbackUrl, signInReturnedError } from "../src/lib/callback-url";

assert.equal(safeCallbackUrl("/dashboard"), "/dashboard");
assert.equal(safeCallbackUrl("/auth/onboarding/seller?x=1"), "/auth/onboarding/seller?x=1");
assert.equal(safeCallbackUrl(null), null);
assert.equal(safeCallbackUrl(""), null);
assert.equal(safeCallbackUrl("https://evil.example/phish"), null);
assert.equal(safeCallbackUrl("//evil.example"), null);
assert.equal(safeCallbackUrl("/\\evil"), "/\\evil");

assert.equal(signInReturnedError("/dashboard"), false);
assert.equal(signInReturnedError("http://n/auth/login?error=CredentialsSignin"), true);
assert.equal(signInReturnedError("/auth/login?error=CredentialsSignin"), true);
assert.equal(signInReturnedError({ error: "CredentialsSignin" }), true);
assert.equal(signInReturnedError({ error: null }), false);
assert.equal(signInReturnedError(undefined), false);

console.log("check-auth: ok");
