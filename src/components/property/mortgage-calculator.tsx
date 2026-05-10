"use client";

import { useMemo, useState } from "react";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { formatPrice } from "@/lib/utils";

export function MortgageCalculator({ homePrice }: { homePrice: number }) {
  const [down, setDown] = useState(20);
  const [rate, setRate] = useState(6.2);
  const [years, setYears] = useState(30);

  const payment = useMemo(() => {
    const principal = homePrice * (1 - down / 100);
    const monthlyRate = rate / 100 / 12;
    const n = years * 12;
    if (monthlyRate === 0) return principal / n;
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
  }, [down, homePrice, rate, years]);

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
      <h3 className="text-sm font-semibold">Mortgage estimator</h3>
      <p className="mt-1 text-xs text-muted-foreground">Illustrative only — not financial advice.</p>
      <div className="mt-6 space-y-5">
        <div>
          <Label>Down payment · {down}%</Label>
          <Slider value={[down]} min={5} max={50} step={1} onValueChange={(v) => setDown(v[0] ?? 20)} className="mt-3" />
        </div>
        <div>
          <Label>Interest rate · {rate.toFixed(2)}%</Label>
          <Slider value={[rate]} min={2} max={10} step={0.05} onValueChange={(v) => setRate(v[0] ?? 6)} className="mt-3" />
        </div>
        <div>
          <Label>Term · {years} years</Label>
          <Slider value={[years]} min={10} max={30} step={1} onValueChange={(v) => setYears(v[0] ?? 30)} className="mt-3" />
        </div>
      </div>
      <div className="mt-6 rounded-2xl bg-muted/60 p-4">
        <p className="text-xs text-muted-foreground">Est. monthly payment</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">{formatPrice(payment)}</p>
      </div>
    </div>
  );
}
