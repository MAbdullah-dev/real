import { Suspense } from "react";

import { AgentOnboardingWizard } from "@/components/agent/agent-onboarding-wizard";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAgency, requiredCredentialTypes } from "@/server/agency";
import { listPlans } from "@/server/plans";

async function OnboardingContent() {
  const { session, agency, membership } = await requireAgency();
  if (!agency || !membership) {
    return <p className="text-primary-foreground">Unable to load agency.</p>;
  }

  const plans = await listPlans();
  const required = requiredCredentialTypes(agency.country, agency.type);

  return (
    <AgentOnboardingWizard
      initialStep={Math.min(agency.onboardingStep, 4)}
      status={agency.status}
      statusNote={agency.statusNote}
      identity={{
        type: agency.type,
        name: agency.name ?? session.user.name ?? "",
        country: agency.country ?? "PK",
        city: agency.city ?? "",
        markets: agency.markets,
        title: membership.title ?? "",
      }}
      credentials={agency.credentials.map((c) => ({
        type: c.type,
        value: c.value ?? "",
        authority: c.authority ?? "",
        jurisdiction: c.jurisdiction ?? "",
        expiresAt: c.expiresAt ? c.expiresAt.toISOString().slice(0, 10) : "",
        fileUrl: c.fileUrl ?? "",
      }))}
      requiredTypes={required}
      profile={{
        bio: agency.bio ?? "",
        image: session.user.image ?? "",
        languages: membership.languages.join(", "),
        specialties: membership.specialties.join(", "),
        whatsapp: membership.whatsapp ?? "",
      }}
      standardsAccepted={Boolean(agency.standardsAcceptedAt)}
      plans={plans.map((p) => ({
        id: p.id,
        name: p.name,
        priceMonthly: p.priceMonthly,
        listingLimit: p.listingLimit === "custom" ? null : p.listingLimit,
      }))}
      currentPlanName={agency.subscriptions[0]?.plan.name ?? null}
    />
  );
}

export default function AgentOnboardingPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[32rem] w-full rounded-3xl" />}>
      <OnboardingContent />
    </Suspense>
  );
}
