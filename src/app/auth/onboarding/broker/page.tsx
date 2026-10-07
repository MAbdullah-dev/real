import { redirect } from "next/navigation";

import { BrokerProfileForm } from "@/components/broker/broker-profile-form";
import { brokerConsoleAccess, requireBroker } from "@/server/broker";

export default async function BrokerOnboardingPage() {
  const { profile, isAdmin } = await requireBroker();
  if (!isAdmin && brokerConsoleAccess(profile?.status) !== "onboarding") {
    redirect("/broker");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-[var(--section-x)] py-16">
      <div>
        <p className="text-sm font-medium text-primary">Broker onboarding</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Set up your platform profile</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          You represent the platform for seller-owned homes. You will not create listings or join an
          agency.
        </p>
      </div>
      <BrokerProfileForm
        defaults={{
          phone: profile?.phone ?? "",
          country: profile?.country ?? "PK",
          city: profile?.city ?? "",
          title: profile?.title ?? "Platform broker",
          bio: profile?.bio ?? "",
          whatsapp: profile?.whatsapp ?? "",
        }}
        canSubmitReview
      />
    </div>
  );
}
