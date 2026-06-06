import type { Metadata } from "next";
import { CalendarDays, CreditCard, Users, Wallet } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";
import { prisma } from "@/lib/prisma";
import { getCurrentStudio } from "@/lib/tenant";

export const metadata: Metadata = { title: "Overview" };

export const dynamic = "force-dynamic";

interface MetricCardProps {
  label: string;
  value: string;
  helper: string;
  icon: React.ComponentType<{ className?: string }>;
}

function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
}: MetricCardProps): JSX.Element {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        <p className="text-xs text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  );
}

/**
 * Aggregate the headline metrics for the active studio. Every query is
 * tenant-scoped via `studioId` so that nothing leaks across studios.
 */
async function loadMetrics(studioId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [members, upcomingClasses, monthBookings, monthRevenue] =
    await Promise.all([
      prisma.user.count({ where: { studioId, role: "MEMBER" } }),
      prisma.class.count({
        where: { studioId, startTime: { gte: now } },
      }),
      prisma.booking.count({
        where: {
          studioId,
          status: "CONFIRMED",
          createdAt: { gte: startOfMonth, lt: startOfNextMonth },
        },
      }),
      prisma.payment.aggregate({
        where: {
          studioId,
          status: "COMPLETED",
          createdAt: { gte: startOfMonth, lt: startOfNextMonth },
        },
        _sum: { amount: true },
      }),
    ]);

  return {
    members,
    upcomingClasses,
    monthBookings,
    monthRevenue: Number(monthRevenue._sum.amount ?? 0),
  };
}

export default async function DashboardOverviewPage(): Promise<JSX.Element> {
  const studio = await getCurrentStudio();
  const metrics = await loadMetrics(studio.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">
          Live performance metrics for {studio.name}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Active members"
          value={metrics.members.toString()}
          helper="Members with a current account"
          icon={Users}
        />
        <MetricCard
          label="Upcoming classes"
          value={metrics.upcomingClasses.toString()}
          helper="From now until end of schedule"
          icon={CalendarDays}
        />
        <MetricCard
          label="Bookings this month"
          value={metrics.monthBookings.toString()}
          helper="Confirmed bookings"
          icon={CreditCard}
        />
        <MetricCard
          label="Revenue this month"
          value={formatCurrency(metrics.monthRevenue, studio.currency)}
          helper="Completed payments only"
          icon={Wallet}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Welcome to FitStudio</CardTitle>
          <CardDescription>
            This dashboard is the operating console for your studio. Use the
            sidebar to manage classes, members, billing and studio settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <ul className="list-disc space-y-1 pl-5">
            <li>Schedule recurring classes from <strong>Classes</strong>.</li>
            <li>Issue memberships and credit packs from <strong>Members</strong>.</li>
            <li>Track Stripe payouts and refunds from <strong>Payments</strong>.</li>
            <li>Enable Verifactu invoicing from <strong>Settings</strong> if you operate in Spain.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
