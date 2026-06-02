"use client";

import * as React from "react";
import { Check, Sparkles } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckoutForm } from "@/components/payments/checkout-form";
import { formatCurrency } from "@/lib/currency";

export interface PlanInput {
  id: string;
  name: string;
  description: string | null;
  type: "UNLIMITED" | "CLASS_PACK" | "DROP_IN";
  classCount: number | null;
  price: string;
  currency: "EUR" | "AED" | "USD" | "LBP";
  billingInterval: "MONTHLY" | "ANNUAL" | "ONE_TIME";
}

interface PlanGridProps {
  plans: readonly PlanInput[];
  studio: {
    name: string;
    country: "ES" | "AE" | "LB";
    stripeReady: boolean;
  };
  signedIn: boolean;
  appUrl: string;
}

const INTERVAL_LABEL: Record<PlanInput["billingInterval"], string> = {
  MONTHLY: "per month",
  ANNUAL: "per year",
  ONE_TIME: "one-off purchase",
};

function describeBullets(plan: PlanInput): string[] {
  const lines: string[] = [];
  if (plan.type === "UNLIMITED") {
    lines.push("Unlimited group classes");
    lines.push("Reserve up to 14 days in advance");
  } else if (plan.type === "CLASS_PACK" && plan.classCount) {
    lines.push(`${plan.classCount} class credits`);
    lines.push("Credits remain valid for 90 days");
  } else {
    lines.push("Single-class drop-in");
  }
  lines.push("Cancel up to 2 hours before class");
  return lines;
}

function pickHighlight(plans: readonly PlanInput[]): string | null {
  const unlimited = plans.find((entry) => entry.type === "UNLIMITED");
  if (unlimited) return unlimited.id;
  const pack = plans.find((entry) => entry.type === "CLASS_PACK");
  return pack?.id ?? plans[0]?.id ?? null;
}

export function PlanGrid({
  plans,
  studio,
  signedIn,
  appUrl,
}: PlanGridProps): JSX.Element {
  const [activePlan, setActivePlan] = React.useState<PlanInput | null>(null);
  const highlightedId = React.useMemo(() => pickHighlight(plans), [plans]);

  if (activePlan) {
    return (
      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <CardTitle>{activePlan.name}</CardTitle>
          <CardDescription>
            {formatCurrency(activePlan.price, activePlan.currency)}{" "}
            <span className="text-muted-foreground">
              · {INTERVAL_LABEL[activePlan.billingInterval]}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CheckoutForm
            studio={studio}
            plan={{
              id: activePlan.id,
              name: activePlan.name,
              price: activePlan.price,
              currency: activePlan.currency,
              billingInterval: activePlan.billingInterval,
              type: activePlan.type,
              classCount: activePlan.classCount,
            }}
            appUrl={appUrl}
            onCancel={() => setActivePlan(null)}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {plans.map((plan) => {
        const isHighlighted = plan.id === highlightedId;
        return (
          <Card
            key={plan.id}
            className={`relative flex flex-col transition-shadow duration-200 ${
              isHighlighted
                ? "border-primary shadow-lg ring-1 ring-primary/30"
                : "hover:shadow-md"
            }`}
          >
            {isHighlighted ? (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="gap-1 bg-primary text-primary-foreground">
                  <Sparkles className="h-3 w-3" aria-hidden />
                  Most popular
                </Badge>
              </div>
            ) : null}
            <CardHeader className="space-y-2 pt-7">
              <Badge variant="outline" className="w-fit">
                {plan.type}
              </Badge>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              {plan.description ? (
                <CardDescription>{plan.description}</CardDescription>
              ) : null}
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div>
                <p className="text-3xl font-semibold tabular-nums">
                  {formatCurrency(plan.price, plan.currency)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {INTERVAL_LABEL[plan.billingInterval]}
                </p>
              </div>
              <ul className="space-y-2 text-sm">
                {describeBullets(plan).map((line) => (
                  <li key={line} className="flex items-start gap-2">
                    <Check
                      className="mt-0.5 h-4 w-4 text-emerald-600"
                      aria-hidden
                    />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto">
                {!signedIn ? (
                  <Button
                    asChild
                    className="w-full cursor-pointer transition-colors duration-200"
                  >
                    <Link href="/sign-in">Sign in to buy</Link>
                  </Button>
                ) : !studio.stripeReady ? (
                  <Button
                    disabled
                    className="w-full cursor-not-allowed"
                    title="Studio has not connected Stripe yet"
                  >
                    Coming soon
                  </Button>
                ) : (
                  <Button
                    onClick={() => setActivePlan(plan)}
                    className={`w-full cursor-pointer transition-colors duration-200 ${
                      isHighlighted ? "" : "bg-primary/90 hover:bg-primary"
                    }`}
                  >
                    Choose plan
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
