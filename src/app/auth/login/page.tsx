import { Suspense } from "react";

import { redirectIfSignedIn } from "@/server/auth";

import { LoginForm } from "./login-form";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
  return (
    <Suspense>
      <LoginGate googleEnabled={googleEnabled} searchParams={searchParams} />
    </Suspense>
  );
}

async function LoginGate({
  googleEnabled,
  searchParams,
}: {
  googleEnabled: boolean;
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const params = await searchParams;
  await redirectIfSignedIn(params.callbackUrl);
  return <LoginForm googleEnabled={googleEnabled} />;
}
