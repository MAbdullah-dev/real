import { redirect } from "next/navigation";

import { SellerProfileForm } from "@/components/seller/seller-profile-form";
import { requireSeller, sellerConsoleAccess } from "@/server/seller";

export default async function SellerOnboardingPage() {
  const { profile, isAdmin } = await requireSeller();
  if (!isAdmin && sellerConsoleAccess(profile?.status) !== "onboarding") {
    redirect("/seller");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-[var(--section-x)] py-16">
      <div>
        <p className="text-sm font-medium text-primary">Seller onboarding</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Tell us about yourself</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          A short profile lets buyers reach you. After you submit, an admin reviews your account
          before listings can go live.
        </p>
      </div>
      <SellerProfileForm
        defaults={{
          phone: profile?.phone ?? "",
          country: profile?.country ?? "PK",
          city: profile?.city ?? "",
          bio: profile?.bio ?? "",
        }}
        canSubmitReview
      />
    </div>
  );
}
