import { auth } from "@clerk/nextjs/server";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlanGrid, type PlanInput } from "@/components/payments/plan-grid";
import { prisma } from "@/lib/prisma";
import { getCurrentStudio } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export const metadata = { title: "Memberships" };

export default async function MembershipPage(): Promise<JSX.Element> {
  const studio = await getCurrentStudio();
  const { userId } = auth();

  const [plans, studioRow] = await Promise.all([
    prisma.membership.findMany({
      where: { studioId: studio.id, isActive: true },
      orderBy: [{ type: "asc" }, { price: "asc" }],
    }),
    prisma.studio.findUnique({
      where: { id: studio.id },
      select: { stripeAccountId: true, stripeAccountStatus: true },
    }),
  ]);

  const formatted: PlanInput[] = plans.map((plan) => ({
    id: plan.id,
    name: plan.name,
    description: plan.description,
    type: plan.type,
    classCount: plan.classCount,
    price: plan.price.toString(),
    currency: plan.currency,
    billingInterval: plan.billingInterval,
  }));

  const stripeReady = Boolean(
    studioRow?.stripeAccountId &&
      (studioRow.stripeAccountStatus === "active" ||
        studioRow.stripeAccountStatus === null),
  );

  return (
    <div className="space-y-10">
      <section className="space-y-3 text-center">
        <span className="inline-block rounded-full border bg-muted/40 px-3 py-1 text-xs uppercase tracking-wide text-muted-foreground">
          Memberships
        </span>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Train at {studio.name} the way you want
        </h1>
        <p className="mx-auto max-w-2xl text-base text-muted-foreground">
          Pick the plan that fits your routine. Cancel any class up to two
          hours in advance — no questions asked.
        </p>
      </section>

      {formatted.length === 0 ? (
        <Card className="mx-auto max-w-xl">
          <CardHeader>
            <CardTitle>Membership plans are launching soon</CardTitle>
            <CardDescription>
              {studio.name} hasn't published any plans yet. Drop in to a
              class while we get the catalogue ready.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <PlanGrid
          plans={formatted}
          studio={{
            name: studio.name,
            country: studio.country,
            stripeReady,
          }}
          signedIn={Boolean(userId)}
          appUrl={process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001"}
        />
      )}

      {!stripeReady ? (
        <Card className="mx-auto max-w-xl border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/30">
          <CardContent className="pt-6 text-sm text-amber-900 dark:text-amber-200">
            This studio is finishing payment setup. You can browse plans but
            checkout will reopen as soon as Stripe is connected.
          </CardContent>
        </Card>
      ) : null}

      <p className="mx-auto max-w-xl text-center text-xs text-muted-foreground">
        Card &amp; SEPA payments are processed by Stripe. We never store your
        full card number.
      </p>
    </div>
  );
}
