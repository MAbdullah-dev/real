"use client";

import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const steps = ["Agency profile", "Plan selection", "Media standards", "Go live"];

export default function AgentOnboardingPage() {
  const [step, setStep] = useState(0);

  return (
    <Card className="glass-panel rounded-3xl border-white/20 shadow-[var(--shadow-soft)]">
      <CardHeader>
        <CardTitle className="text-2xl text-primary-foreground">Agent onboarding</CardTitle>
        <CardDescription className="text-primary-foreground/70">
          Guided flow — production version persists progress server-side.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex justify-between text-xs text-primary-foreground/80">
            <span>
              Step {step + 1} / {steps.length}
            </span>
            <span>{steps[step]}</span>
          </div>
          <Progress value={((step + 1) / steps.length) * 100} className="mt-2 h-2 bg-background/30" />
        </div>
        <div className="rounded-2xl border border-white/15 bg-background/40 p-6 text-sm text-primary-foreground/90">
          {step === 0 && <p>Tell us about your brokerage licenses and primary markets.</p>}
          {step === 1 && <p>Choose Basic (3 listings), Premium (6), or Enterprise (custom).</p>}
          {step === 2 && <p>Accept media QA standards — HDR photography, honest framing, disclosure checklist.</p>}
          {step === 3 && (
            <p className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              You’re cleared to publish — concierge will monitor your first visits closely.
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1 rounded-full bg-background/70"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            Back
          </Button>
          {step === steps.length - 1 ? (
            <Button asChild className="flex-1 rounded-full">
              <Link href="/agent">Enter console</Link>
            </Button>
          ) : (
            <Button
              type="button"
              className="flex-1 rounded-full"
              onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
            >
              Continue
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
