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
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Set up your practice</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Independent brokers connect buyers and sellers, arrange visits, and guide the deal — without
          an agency shell.
        </p>
      </div>
      <BrokerProfileForm
        defaults={{
          phone: profile?.phone ?? "",
          country: profile?.country ?? "PK",
          city: profile?.city ?? "",
          title: profile?.title ?? "Independent broker",
          bio: profile?.bio ?? "",
          whatsapp: profile?.whatsapp ?? "",
        }}
        canSubmitReview
      />
    </div>
  );
}
