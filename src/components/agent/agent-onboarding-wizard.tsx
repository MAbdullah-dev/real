"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useUploadThing } from "@/lib/uploadthing";
import { CREDENTIAL_LABELS } from "@/lib/agency-labels";
import {
  acceptStandardsAction,
  saveOnboardingCredentialsAction,
  saveOnboardingIdentityAction,
  saveOnboardingProfileAction,
  submitAgencyForReviewAction,
} from "@/server/actions/onboarding";
import { startCheckoutAction } from "@/server/actions/billing";

const STEPS = [
  "Business identity",
  "Credentials",
  "Public profile",
  "Standards",
  "Plan & submit",
] as const;

type CredentialDraft = {
  type: keyof typeof CREDENTIAL_LABELS;
  value: string;
  authority: string;
  jurisdiction: string;
  expiresAt: string;
  fileUrl: string;
};

type PlanOption = { id: string; name: string; priceMonthly: number; listingLimit: number | null };

type Props = {
  initialStep: number;
  status: string;
  statusNote: string | null;
  identity: {
    type: "individual" | "agency" | "developer";
    name: string;
    country: string;
    city: string;
    markets: string[];
    title: string;
  };
  credentials: CredentialDraft[];
  requiredTypes: string[];
  profile: {
    bio: string;
    image: string;
    languages: string;
    specialties: string;
    whatsapp: string;
  };
  standardsAccepted: boolean;
  plans: PlanOption[];
  currentPlanName: string | null;
};

export function AgentOnboardingWizard(props: Props) {
  const router = useRouter();
  const [step, setStep] = useState(Math.min(props.initialStep, STEPS.length - 1));
  const [pending, startTransition] = useTransition();

  const [identity, setIdentity] = useState(props.identity);
  const [marketDraft, setMarketDraft] = useState(props.identity.markets.join(", "));
  const [credentials, setCredentials] = useState<CredentialDraft[]>(() => {
    const byType = new Map(props.credentials.map((c) => [c.type, c]));
    const types = Array.from(
      new Set([...props.requiredTypes, ...props.credentials.map((c) => c.type)])
    ) as CredentialDraft["type"][];
    return types.map(
      (type) =>
        byType.get(type) ?? {
          type,
          value: "",
          authority: "",
          jurisdiction: "",
          expiresAt: "",
          fileUrl: "",
        }
    );
  });
  const [profile, setProfile] = useState(props.profile);
  const [standards, setStandards] = useState(props.standardsAccepted);

  const { startUpload, isUploading } = useUploadThing("credentialDoc", {
    onUploadError(error) {
      toast.error(error.message);
    },
  });
  const { startUpload: uploadAvatar, isUploading: avatarUploading } = useUploadThing("avatar", {
    onUploadError(error) {
      toast.error(error.message);
    },
  });

  const progress = useMemo(() => ((step + 1) / STEPS.length) * 100, [step]);

  if (props.status === "pending_review") {
    return (
      <Card className="glass-panel rounded-3xl border-white/20 shadow-[var(--shadow-soft)]">
        <CardHeader>
          <CardTitle className="text-2xl text-primary-foreground">Under review</CardTitle>
          <CardDescription className="text-primary-foreground/70">
            Your application is with our team. You can browse the console in read-only mode while
            you wait.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild className="rounded-full">
            <Link href="/agency">Open console</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (props.status === "active") {
    return (
      <Card className="glass-panel rounded-3xl border-white/20 shadow-[var(--shadow-soft)]">
        <CardHeader>
          <CardTitle className="text-2xl text-primary-foreground">You&apos;re approved</CardTitle>
          <CardDescription className="text-primary-foreground/70">
            Your agency is live. Start publishing listings from the console.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="rounded-full">
            <Link href="/agency">Enter console</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-panel rounded-3xl border-white/20 shadow-[var(--shadow-soft)]">
      <CardHeader>
        <CardTitle className="text-2xl text-primary-foreground">Agent onboarding</CardTitle>
        <CardDescription className="text-primary-foreground/70">
          {props.status === "rejected"
            ? `Needs changes: ${props.statusNote ?? "Update the flagged details and resubmit."}`
            : "Complete each step — progress is saved as you go."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex justify-between text-xs text-primary-foreground/80">
            <span>
              Step {step + 1} / {STEPS.length}
            </span>
            <span>{STEPS[step]}</span>
          </div>
          <Progress value={progress} className="mt-2 h-2 bg-background/30" />
        </div>

        {step === 0 ? (
          <div className="space-y-4 rounded-2xl border border-white/15 bg-background/40 p-5">
            <div className="space-y-2">
              <Label className="text-primary-foreground">Account type</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background/90 px-3 text-sm"
                value={identity.type}
                onChange={(e) =>
                  setIdentity((s) => ({
                    ...s,
                    type: e.target.value as Props["identity"]["type"],
                  }))
                }
              >
                <option value="individual">Independent agent</option>
                <option value="agency">Agency / brokerage</option>
                <option value="developer">Developer</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-primary-foreground">
                {identity.type === "individual" ? "Display name" : "Agency / company name"}
              </Label>
              <Input
                className="bg-background/90"
                value={identity.name}
                onChange={(e) => setIdentity((s) => ({ ...s, name: e.target.value }))}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-primary-foreground">Country code</Label>
                <Input
                  className="bg-background/90"
                  placeholder="PK"
                  value={identity.country}
                  onChange={(e) => setIdentity((s) => ({ ...s, country: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-primary-foreground">City</Label>
                <Input
                  className="bg-background/90"
                  value={identity.city}
                  onChange={(e) => setIdentity((s) => ({ ...s, city: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-primary-foreground">Primary markets (comma-separated)</Label>
              <Input
                className="bg-background/90"
                placeholder="Lahore, Islamabad"
                value={marketDraft}
                onChange={(e) => setMarketDraft(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-primary-foreground">Job title (optional)</Label>
              <Input
                className="bg-background/90"
                value={identity.title}
                onChange={(e) => setIdentity((s) => ({ ...s, title: e.target.value }))}
              />
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-4 rounded-2xl border border-white/15 bg-background/40 p-5">
            {credentials.map((cred, index) => (
              <div key={cred.type} className="space-y-3 border-b border-white/10 pb-4 last:border-0">
                <p className="text-sm font-medium text-primary-foreground">
                  {CREDENTIAL_LABELS[cred.type]}
                  {props.requiredTypes.includes(cred.type) ? " *" : ""}
                </p>
                <Input
                  className="bg-background/90"
                  placeholder="Document / ID number"
                  value={cred.value}
                  onChange={(e) =>
                    setCredentials((rows) =>
                      rows.map((row, i) => (i === index ? { ...row, value: e.target.value } : row))
                    )
                  }
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    className="bg-background/90"
                    placeholder="Issuing authority"
                    value={cred.authority}
                    onChange={(e) =>
                      setCredentials((rows) =>
                        rows.map((row, i) =>
                          i === index ? { ...row, authority: e.target.value } : row
                        )
                      )
                    }
                  />
                  <Input
                    className="bg-background/90"
                    placeholder="Jurisdiction"
                    value={cred.jurisdiction}
                    onChange={(e) =>
                      setCredentials((rows) =>
                        rows.map((row, i) =>
                          i === index ? { ...row, jurisdiction: e.target.value } : row
                        )
                      )
                    }
                  />
                </div>
                <Input
                  type="date"
                  className="bg-background/90"
                  value={cred.expiresAt}
                  onChange={(e) =>
                    setCredentials((rows) =>
                      rows.map((row, i) =>
                        i === index ? { ...row, expiresAt: e.target.value } : row
                      )
                    )
                  }
                />
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-full bg-background/70"
                    disabled={isUploading}
                    onClick={async () => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = "image/*,application/pdf";
                      input.onchange = async () => {
                        const file = input.files?.[0];
                        if (!file) return;
                        const uploaded = await startUpload([file]);
                        const url = uploaded?.[0]?.ufsUrl ?? uploaded?.[0]?.url;
                        if (!url) return;
                        setCredentials((rows) =>
                          rows.map((row, i) => (i === index ? { ...row, fileUrl: url } : row))
                        );
                        toast.success("Document uploaded");
                      };
                      input.click();
                    }}
                  >
                    {cred.fileUrl ? "Replace file" : "Upload scan"}
                  </Button>
                  {cred.fileUrl ? (
                    <a
                      href={cred.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary-foreground/80 underline"
                    >
                      View file
                    </a>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4 rounded-2xl border border-white/15 bg-background/40 p-5">
            <div className="space-y-2">
              <Label className="text-primary-foreground">Public bio</Label>
              <Textarea
                className="min-h-28 bg-background/90"
                value={profile.bio}
                onChange={(e) => setProfile((s) => ({ ...s, bio: e.target.value }))}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-full bg-background/70"
                disabled={avatarUploading}
                onClick={async () => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*";
                  input.onchange = async () => {
                    const file = input.files?.[0];
                    if (!file) return;
                    const uploaded = await uploadAvatar([file]);
                    const url = uploaded?.[0]?.ufsUrl ?? uploaded?.[0]?.url;
                    if (!url) return;
                    setProfile((s) => ({ ...s, image: url }));
                    toast.success("Photo updated");
                  };
                  input.click();
                }}
              >
                {profile.image ? "Replace photo" : "Upload photo"}
              </Button>
              {profile.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.image} alt="" className="h-12 w-12 rounded-full object-cover" />
              ) : null}
            </div>
            <div className="space-y-2">
              <Label className="text-primary-foreground">Languages (comma-separated)</Label>
              <Input
                className="bg-background/90"
                value={profile.languages}
                onChange={(e) => setProfile((s) => ({ ...s, languages: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-primary-foreground">Specialties (comma-separated)</Label>
              <Input
                className="bg-background/90"
                value={profile.specialties}
                onChange={(e) => setProfile((s) => ({ ...s, specialties: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-primary-foreground">WhatsApp (optional)</Label>
              <Input
                className="bg-background/90"
                value={profile.whatsapp}
                onChange={(e) => setProfile((s) => ({ ...s, whatsapp: e.target.value }))}
              />
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4 rounded-2xl border border-white/15 bg-background/40 p-5 text-sm text-primary-foreground/90">
            <p>
              By continuing you confirm listings use honest photography, accurate facts, and no
              duplicate or misattributed media.
            </p>
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                className="mt-1"
                checked={standards}
                onChange={(e) => setStandards(e.target.checked)}
              />
              <span>I accept Estate Elite media and listing accuracy standards.</span>
            </label>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-4 rounded-2xl border border-white/15 bg-background/40 p-5">
            <p className="text-sm text-primary-foreground/90">
              Current plan: <strong>{props.currentPlanName ?? "Free (1 listing)"}</strong>. You can
              upgrade now or stay on Free and submit for review.
            </p>
            <div className="grid gap-3">
              {props.plans.map((plan) => (
                <div
                  key={plan.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-background/50 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-primary-foreground">{plan.name}</p>
                    <p className="text-xs text-primary-foreground/70">
                      ${plan.priceMonthly}/mo ·{" "}
                      {plan.listingLimit == null ? "Unlimited" : `${plan.listingLimit} listings`}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-full bg-background/70"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        const result = await startCheckoutAction(plan.id);
                        if (result.error) toast.error(result.error);
                        else if (result.message) toast.success(result.message);
                        router.refresh();
                      })
                    }
                  >
                    Choose
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1 rounded-full bg-background/70"
            disabled={step === 0 || pending}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            Back
          </Button>
          <Button
            type="button"
            className="flex-1 rounded-full"
            disabled={pending || isUploading || avatarUploading}
            onClick={() =>
              startTransition(async () => {
                if (step === 0) {
                  const result = await saveOnboardingIdentityAction({
                    ...identity,
                    markets: marketDraft
                      .split(",")
                      .map((m) => m.trim())
                      .filter(Boolean),
                  });
                  if (result.error) {
                    toast.error(result.error);
                    return;
                  }
                  setStep(1);
                  router.refresh();
                  return;
                }
                if (step === 1) {
                  const result = await saveOnboardingCredentialsAction(credentials);
                  if (result.error) {
                    toast.error(result.error);
                    return;
                  }
                  setStep(2);
                  router.refresh();
                  return;
                }
                if (step === 2) {
                  const result = await saveOnboardingProfileAction({
                    bio: profile.bio,
                    image: profile.image,
                    whatsapp: profile.whatsapp,
                    languages: profile.languages
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                    specialties: profile.specialties
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  });
                  if (result.error) {
                    toast.error(result.error);
                    return;
                  }
                  setStep(3);
                  router.refresh();
                  return;
                }
                if (step === 3) {
                  if (!standards) {
                    toast.error("Accept the standards to continue.");
                    return;
                  }
                  const result = await acceptStandardsAction();
                  if (result.error) {
                    toast.error(result.error);
                    return;
                  }
                  setStep(4);
                  router.refresh();
                  return;
                }
                const result = await submitAgencyForReviewAction();
                if (result.error) {
                  toast.error(result.error);
                  return;
                }
                toast.success("Submitted for review");
                router.refresh();
              })
            }
          >
            {step === STEPS.length - 1 ? "Submit for review" : "Save & continue"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
