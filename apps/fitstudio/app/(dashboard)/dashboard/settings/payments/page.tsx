import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  CircleDashed,
  ShieldCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StripeConnectButton } from "@/components/payments/stripe-connect-button";
import { formatCurrency } from "@/lib/currency";
import { requireOwner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { actingAs, getStripe } from "@/lib/stripe";
import { getCurrentStudio } from "@/lib/tenant";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Payments setup" };

export const dynamic = "force-dynamic";

interface ConnectedSummary {
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  defaultCurrency: string | null;
  lastPayout: { amount: number; currency: string; arrivalDate: Date } | null;
}

async function loadConnectedSummary(
  stripeAccountId: string,
): Promise<ConnectedSummary | null> {
  try {
    const stripe = getStripe();
    const account = await stripe.accounts.retrieve(stripeAccountId);
    const payouts = await stripe.payouts.list(
      { limit: 1 },
      actingAs(stripeAccountId),
    );
    const last = payouts.data[0];
    return {
      chargesEnabled: account.charges_enabled ?? false,
      payoutsEnabled: account.payouts_enabled ?? false,
      detailsSubmitted: account.details_submitted ?? false,
      defaultCurrency: account.default_currency?.toUpperCase() ?? null,
      lastPayout: last
        ? {
            amount: last.amount / (last.currency === "lbp" ? 1 : 100),
            currency: last.currency.toUpperCase(),
            arrivalDate: new Date((last.arrival_date ?? 0) * 1000),
          }
        : null,
    };
  } catch (error) {
    console.error("[settings/payments] failed to fetch account", error);
    return null;
  }
}

interface PageProps {
  searchParams: { stripeConnected?: string; stripeError?: string };
}

export default async function PaymentsSettingsPage({
  searchParams,
}: PageProps): Promise<JSX.Element> {
  await requireOwner();
  const studio = await getCurrentStudio();

  const studioRow = await prisma.studio.findUnique({
    where: { id: studio.id },
    select: {
      stripeAccountId: true,
      stripeAccountStatus: true,
      currency: true,
      country: true,
    },
  });

  const summary = studioRow?.stripeAccountId
    ? await loadConnectedSummary(studioRow.stripeAccountId)
    : null;

  const isConnected = Boolean(
    studioRow?.stripeAccountId && summary?.chargesEnabled,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="cursor-pointer gap-2"
        >
          <Link href="/dashboard/settings">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to settings
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Payments &amp; payouts
          </h1>
          <p className="text-sm text-muted-foreground">
            Connect Stripe so {studio.name} can charge members and receive
            payouts directly.
          </p>
        </div>
        <StripeConnectButton isConnected={isConnected} />
      </div>

      {searchParams.stripeError ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="flex flex-row items-start gap-3 space-y-0">
            <AlertCircle
              className="h-5 w-5 text-destructive"
              aria-hidden
            />
            <div>
              <CardTitle className="text-base">
                Stripe connection failed
              </CardTitle>
              <CardDescription>
                Reason: <code>{searchParams.stripeError}</code>. Try the
                Connect button again.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      ) : null}

      {searchParams.stripeConnected === "connected" ? (
        <Card className="border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/30">
          <CardHeader className="flex flex-row items-start gap-3 space-y-0">
            <CheckCircle2
              className="h-5 w-5 text-emerald-600 dark:text-emerald-400"
              aria-hidden
            />
            <div>
              <CardTitle className="text-base">
                Stripe is connected
              </CardTitle>
              <CardDescription>
                You can now accept card and SEPA payments through this studio.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
            <div>
              <CardTitle>Stripe Connect</CardTitle>
              <CardDescription>
                Express account used to receive payouts in {studioRow?.currency}.
              </CardDescription>
            </div>
            {isConnected ? (
              <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-600">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                Connected
              </Badge>
            ) : studioRow?.stripeAccountId ? (
              <Badge variant="secondary" className="gap-1">
                <CircleDashed className="h-3.5 w-3.5" aria-hidden />
                Pending
              </Badge>
            ) : (
              <Badge variant="outline">Not connected</Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground">Account id</p>
                <p className="font-mono text-xs">
                  {studioRow?.stripeAccountId ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <p>
                  {studioRow?.stripeAccountStatus ?? "Not started"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Charges enabled</p>
                <p>{summary?.chargesEnabled ? "Yes" : "No"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Payouts enabled</p>
                <p>{summary?.payoutsEnabled ? "Yes" : "No"}</p>
              </div>
            </div>
            {!isConnected ? (
              <p className="rounded-md border border-dashed bg-muted/30 p-3 text-xs text-muted-foreground">
                You need a Stripe account before members can purchase
                memberships. Stripe will collect business details, banking
                information and tax forms during onboarding.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Last payout</CardTitle>
            <CardDescription>
              Most recent transfer from Stripe to your bank.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {summary?.lastPayout ? (
              <div className="space-y-1 text-sm">
                <p className="text-2xl font-semibold tabular-nums">
                  {formatCurrency(
                    summary.lastPayout.amount,
                    summary.lastPayout.currency as
                      | "EUR"
                      | "AED"
                      | "USD"
                      | "LBP",
                  )}
                </p>
                <p className="text-muted-foreground">
                  Arrives{" "}
                  {formatDateTime(
                    summary.lastPayout.arrivalDate,
                    studio.timezone,
                  )}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No payouts yet. They start once Stripe has cleared an
                initial review period.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
