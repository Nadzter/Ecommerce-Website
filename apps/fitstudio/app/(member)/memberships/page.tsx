import { Badge } from "@/components/ui/badge";
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

export const dynamic = "force-dynamic";

export const metadata = { title: "Memberships" };

const INTERVAL_LABEL: Record<string, string> = {
  MONTHLY: "/ month",
  ANNUAL: "/ year",
  ONE_TIME: "one-off",
};

export default async function MembershipsPage(): Promise<JSX.Element> {
  const studio = await getCurrentStudio();
  const memberships = await prisma.membership.findMany({
    where: { studioId: studio.id, isActive: true },
    orderBy: [{ type: "asc" }, { price: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Memberships</h1>
        <p className="text-sm text-muted-foreground">
          Choose a plan to start booking classes at {studio.name}.
        </p>
      </div>

      {memberships.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No membership plans available</CardTitle>
            <CardDescription>
              Please contact the studio directly to sign up.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {memberships.map((entry) => (
            <Card key={entry.id} className="flex flex-col">
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle>{entry.name}</CardTitle>
                  <Badge variant="secondary">{entry.type}</Badge>
                </div>
                {entry.description ? (
                  <CardDescription>{entry.description}</CardDescription>
                ) : null}
              </CardHeader>
              <CardContent className="mt-auto space-y-1 text-sm">
                <p className="text-3xl font-semibold tabular-nums">
                  {formatCurrency(entry.price.toString(), entry.currency)}
                </p>
                <p className="text-muted-foreground">
                  {INTERVAL_LABEL[entry.billingInterval] ?? entry.billingInterval}
                </p>
                {entry.type === "CLASS_PACK" && entry.classCount ? (
                  <p>{entry.classCount} classes included</p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Self-service checkout is rolling out in the next release. Contact{" "}
        {studio.name} directly to purchase a plan today.
      </p>
    </div>
  );
}
