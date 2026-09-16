/**
 * Fixed-window counter guarding public write actions against spam bursts.
 *
 * ponytail: in-process Map — the window resets on redeploy and each instance
 * counts separately. Swap the two Map calls for Redis INCR/EXPIRE when this
 * runs on more than one node.
 */
const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    if (hits.size > 10_000) {
      for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
    }
    return { ok: true as const, retryAfterMs: 0 };
  }

  entry.count += 1;
  if (entry.count > limit) {
    return { ok: false as const, retryAfterMs: entry.resetAt - now };
  }
  return { ok: true as const, retryAfterMs: 0 };
}

export function retryMessage(retryAfterMs: number) {
  const minutes = Math.ceil(retryAfterMs / 60_000);
  return minutes <= 1
    ? "Too many requests — try again in a minute."
    : `Too many requests — try again in ${minutes} minutes.`;
}
