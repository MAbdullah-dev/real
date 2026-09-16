import { BrokerProfileForm } from "@/components/broker/broker-profile-form";
import { requireBroker } from "@/server/broker";

export default async function BrokerProfilePage() {
  const { profile } = await requireBroker();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Broker profile</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          How buyers and sellers reach you while you facilitate the deal.
        </p>
      </div>
      <BrokerProfileForm
        defaults={{
          phone: profile?.phone ?? "",
          country: profile?.country ?? "PK",
          city: profile?.city ?? "",
          title: profile?.title ?? "",
          bio: profile?.bio ?? "",
          whatsapp: profile?.whatsapp ?? "",
        }}
        canSubmitReview={
          profile?.status === "onboarding" ||
          profile?.status === "rejected" ||
          profile?.onboardingStep === 1
        }
      />
    </div>
  );
}
