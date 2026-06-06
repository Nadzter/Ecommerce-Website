import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Users,
  Wallet,
  XCircle,
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
import {
  PaymentsTable,
  type PaymentRow,
} from "@/components/payments/payments-table";
import {
  RevenueChart,
  type RevenuePoint,
} from "@/components/payments/revenue-chart";
import { formatCurrency } from "@/lib/currency";
import { requireOwner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentStudio } from "@/lib/tenant";

export const metadata: Metadata = { title: "Payments" };

export const dynamic = "force-dynamic";

interface MetricCardProps {
  label: string;
  value: string;
  helper: string;
  trend?: { direction: "up" | "down" | "flat"; label: string };
  icon: React.ComponentType<{ className?: string }>;
}

function MetricCard({
  label,
  value,
  helper,
  trend,
  icon: Icon,
}: MetricCardProps): JSX.Element {
  return (
    <Card className="transition-shadow duration-200 hover:shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-semibold tracking-tight tabular-nums">
            {value}
          </p>
          {trend ? (
            <span
              className={`flex items-center text-xs ${
                trend.direction === "up"
                  ? "text-emerald-600"
                  : trend.direction === "down"
                    ? "text-destructive"
                    : "text-muted-foreground"
              }`}
            >
              {trend.direction === "up" ? (
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              ) : trend.direction === "down" ? (
                <ArrowDownRight className="h-3.5 w-3.5" aria-hidden />
              ) : null}
              {trend.label}
            </span>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  );
}

function startOfDayUTC(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default async function PaymentsPage(): Promise<JSX.Element> {
  await requireOwner();
  const studio = await getCurrentStudio();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const startOfThirtyDays = new Date(now.getTime() - 30 * 24 * 3_600_000);
  startOfThirtyDays.setUTCHours(0, 0, 0, 0);

  const [
    revenueMonth,
    revenuePrevMonth,
    revenueRange,
    activeMembers,
    failedPayments,
    rawPayments,
  ] = await Promise.all([
    prisma.payment.aggregate({
      where: {
        studioId: studio.id,
        status: "COMPLETED",
        createdAt: { gte: startOfMonth },
      },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.payment.aggregate({
      where: {
        studioId: studio.id,
        status: "COMPLETED",
        createdAt: { gte: startOfPrevMonth, lt: startOfMonth },
      },
      _sum: { amount: true },
    }),
    prisma.payment.findMany({
      where: {
        studioId: studio.id,
        status: "COMPLETED",
        createdAt: { gte: startOfThirtyDays },
      },
      select: { amount: true, createdAt: true },
    }),
    prisma.userMembership.findMany({
      where: {
        studioId: studio.id,
        isActive: true,
        OR: [{ endsAt: null }, { endsAt: { gte: now } }],
      },
      select: { userId: true },
      distinct: ["userId"],
    }),
    prisma.payment.findMany({
      where: { studioId: studio.id, status: "FAILED" },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.payment.findMany({
      where: { studioId: studio.id },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true },
        },
        membership: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const monthRevenue = Number(revenueMonth._sum.amount ?? 0);
  const prevMonthRevenue = Number(revenuePrevMonth._sum.amount ?? 0);
  const monthCount = revenueMonth._count;
  const trendDirection: "up" | "down" | "flat" =
    monthRevenue > prevMonthRevenue
      ? "up"
      : monthRevenue < prevMonthRevenue
        ? "down"
        : "flat";
  const trendLabel =
    prevMonthRevenue === 0
      ? "—"
      : `${Math.round(((monthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100)}%`;

  const avgPerMember =
    activeMembers.length > 0 ? monthRevenue / activeMembers.length : 0;

  const buckets = new Map<string, number>();
  for (let i = 0; i < 30; i++) {
    const day = new Date(startOfThirtyDays.getTime() + i * 24 * 3_600_000);
    buckets.set(startOfDayUTC(day), 0);
  }
  for (const row of revenueRange) {
    const key = startOfDayUTC(row.createdAt);
    buckets.set(key, (buckets.get(key) ?? 0) + Number(row.amount));
  }
  const chartData: RevenuePoint[] = Array.from(buckets.entries()).map(
    ([date, amount]) => ({ date, amount }),
  );

  const tableRows: PaymentRow[] = rawPayments.map((payment) => ({
    id: payment.id,
    status: payment.status,
    amount: payment.amount.toString(),
    currency: payment.currency,
    createdAt: payment.createdAt.toISOString(),
    description: payment.description,
    invoiceUrl: payment.invoiceUrl,
    user: payment.user,
    membership: payment.membership ? { name: payment.membership.name } : null,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Payments</h1>
          <p className="text-sm text-muted-foreground">
            Revenue and billing for {studio.name}.
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="cursor-pointer gap-2 transition-colors duration-200"
        >
          <Link href="/dashboard/settings/payments">Payments setup</Link>
        </Button>
      </div>

      {failedPayments.length > 0 ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
            <div className="flex items-start gap-3">
              <AlertTriangle
                className="mt-0.5 h-5 w-5 text-destructive"
                aria-hidden
              />
              <div>
                <CardTitle className="text-base">
                  {failedPayments.length} failed payment
                  {failedPayments.length === 1 ? "" : "s"}
                </CardTitle>
                <CardDescription>
                  Members are flagged so you can follow up directly.
                </CardDescription>
              </div>
            </div>
            <Badge variant="destructive">Needs attention</Badge>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {failedPayments.map((entry) => {
              const name =
                [entry.user.firstName, entry.user.lastName]
                  .filter(Boolean)
                  .join(" ") || entry.user.email;
              return (
                <div
                  key={entry.id}
                  className="flex items-center justify-between gap-2 rounded-md border border-destructive/20 bg-background/60 px-3 py-2"
                >
                  <div>
                    <p className="font-medium">{name}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.user.email} ·{" "}
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-sm font-medium tabular-nums">
                    {formatCurrency(entry.amount.toString(), entry.currency)}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Revenue this month"
          value={formatCurrency(monthRevenue, studio.currency)}
          helper={`${monthCount} payments`}
          trend={{ direction: trendDirection, label: trendLabel }}
          icon={Wallet}
        />
        <MetricCard
          label="Active memberships"
          value={activeMembers.length.toString()}
          helper="Members with a live plan"
          icon={Users}
        />
        <MetricCard
          label="Failed payments"
          value={failedPayments.length.toString()}
          helper="Last 90 days"
          icon={XCircle}
        />
        <MetricCard
          label="Avg revenue / member"
          value={formatCurrency(avgPerMember, studio.currency)}
          helper="This month"
          icon={Users}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue (last 30 days)</CardTitle>
          <CardDescription>
            Daily completed payments in {studio.currency}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RevenueChart data={chartData} currency={studio.currency} />
        </CardContent>
      </Card>

      <PaymentsTable rows={tableRows} />
    </div>
  );
}
