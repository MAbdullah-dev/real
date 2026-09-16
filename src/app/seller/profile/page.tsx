import { SellerProfileForm } from "@/components/seller/seller-profile-form";
import { requireSeller } from "@/server/seller";

export default async function SellerProfilePage() {
  const { profile } = await requireSeller();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Seller profile</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Contact details buyers see when they enquire about your listings.
        </p>
      </div>
      <SellerProfileForm
        defaults={{
          phone: profile?.phone ?? "",
          country: profile?.country ?? "PK",
          city: profile?.city ?? "",
          bio: profile?.bio ?? "",
          status: profile?.status,
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
