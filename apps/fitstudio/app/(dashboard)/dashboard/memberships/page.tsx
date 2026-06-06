import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MembershipActiveToggle } from "@/components/payments/membership-active-toggle";
import { MembershipFormDialog } from "@/components/payments/membership-form-dialog";
import { requireOwner } from "@/lib/auth";
import { formatCurrency } from "@/lib/currency";
import { prisma } from "@/lib/prisma";
import { getCurrentStudio } from "@/lib/tenant";

export const metadata: Metadata = { title: "Memberships" };

export const dynamic = "force-dynamic";

const INTERVAL_LABEL: Record<string, string> = {
  MONTHLY: "/ month",
  ANNUAL: "/ year",
  ONE_TIME: "one-off",
};

export default async function MembershipsPage(): Promise<JSX.Element> {
  await requireOwner();
  const studio = await getCurrentStudio();

  const plans = await prisma.membership.findMany({
    where: { studioId: studio.id },
    orderBy: [{ isActive: "desc" }, { type: "asc" }, { price: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Membership plans
          </h1>
          <p className="text-sm text-muted-foreground">
            Pricing tiers offered to members of {studio.name}.
          </p>
        </div>
        <MembershipFormDialog studioCurrency={studio.currency} />
      </div>

      {plans.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No plans yet</CardTitle>
            <CardDescription>
              Create a plan to start accepting memberships.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`flex flex-col transition-shadow duration-200 hover:shadow-md ${
                plan.isActive ? "" : "opacity-60"
              }`}
            >
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">{plan.name}</CardTitle>
                  <Badge
                    variant={plan.type === "UNLIMITED" ? "default" : "secondary"}
                  >
                    {plan.type}
                  </Badge>
                </div>
                {plan.description ? (
                  <CardDescription className="line-clamp-2">
                    {plan.description}
                  </CardDescription>
                ) : null}
              </CardHeader>
              <CardContent className="mt-auto space-y-3 text-sm">
                <div>
                  <p className="text-3xl font-semibold tabular-nums">
                    {formatCurrency(plan.price.toString(), plan.currency)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {INTERVAL_LABEL[plan.billingInterval] ?? plan.billingInterval}
                  </p>
                </div>
                {plan.type === "CLASS_PACK" && plan.classCount ? (
                  <p>{plan.classCount} classes included</p>
                ) : null}
                <div className="flex items-center justify-between border-t pt-3">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    {plan.isActive ? "Active" : "Inactive"}
                  </span>
                  <MembershipActiveToggle
                    id={plan.id}
                    isActive={plan.isActive}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
