import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";
import { requireOwner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentStudio } from "@/lib/tenant";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Payments" };

export const dynamic = "force-dynamic";

const statusVariant = {
  PENDING: "outline",
  COMPLETED: "default",
  REFUNDED: "secondary",
  FAILED: "destructive",
} as const;

export default async function PaymentsPage(): Promise<JSX.Element> {
  // Billing is restricted to owners; staff cannot see payment data.
  await requireOwner();
  const studio = await getCurrentStudio();
  const payments = await prisma.payment.findMany({
    where: { studioId: studio.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { user: { select: { firstName: true, lastName: true, email: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Payments</h1>
        <p className="text-sm text-muted-foreground">
          Recent transactions for {studio.name}.
        </p>
      </div>

      {payments.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No payments recorded</CardTitle>
            <CardDescription>
              Payments will appear here once Stripe is connected and a member
              completes a checkout.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Recent transactions</CardTitle>
            <CardDescription>
              Showing the 50 most recent payments.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {payments.map((payment) => {
                const customer =
                  [payment.user.firstName, payment.user.lastName]
                    .filter(Boolean)
                    .join(" ") || payment.user.email;
                return (
                  <div
                    key={payment.id}
                    className="flex flex-wrap items-center justify-between gap-2 px-6 py-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">{customer}</p>
                      <p className="text-muted-foreground">
                        {formatDateTime(payment.createdAt, studio.timezone)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium tabular-nums">
                        {formatCurrency(
                          payment.amount.toString(),
                          payment.currency,
                        )}
                      </span>
                      <Badge variant={statusVariant[payment.status]}>
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
