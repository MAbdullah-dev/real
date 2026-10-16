import { Suspense } from "react";

import { redirectIfSignedIn } from "@/server/auth";

import { RegisterForm } from "./register-form";

export default function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  return (
    <Suspense>
      <RegisterGate searchParams={searchParams} />
    </Suspense>
  );
}

async function RegisterGate({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const params = await searchParams;
  await redirectIfSignedIn(params.callbackUrl);
  return <RegisterForm />;
}
