/** Same-origin relative paths only. Blocks protocol-relative (`//host`) open redirects. */
export function safeCallbackUrl(url?: string | null) {
  if (!url || !url.startsWith("/") || url.startsWith("//")) return null;
  return url;
}

function signInUrlHasError(result: string) {
  try {
    return new URL(result, "http://n.invalid").searchParams.has("error");
  } catch {
    return false;
  }
}

/** Auth.js `signIn(..., { redirect: false })` returns a URL (or `{ error }`) on failure. */
export function signInReturnedError(result: unknown) {
  if (typeof result === "string") return signInUrlHasError(result);
  if (result && typeof result === "object" && "error" in result) {
    return Boolean((result as { error?: unknown }).error);
  }
  return false;
}
