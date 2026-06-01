import type { Metadata } from "next";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { requireOwner } from "@/lib/auth";
import { getCurrentStudio } from "@/lib/tenant";

export const metadata: Metadata = { title: "Settings" };

export const dynamic = "force-dynamic";

interface FieldRowProps {
  label: string;
  value: React.ReactNode;
}

function FieldRow({ label, value }: FieldRowProps): JSX.Element {
  return (
    <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm sm:col-span-2">{value}</dd>
    </div>
  );
}

export default async function SettingsPage(): Promise<JSX.Element> {
  await requireOwner();
  const studio = await getCurrentStudio();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Studio profile, branding and tax configuration.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Studio profile</CardTitle>
          <CardDescription>
            These details appear on your public booking page and on every
            invoice you issue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="divide-y">
            <FieldRow label="Name" value={studio.name} />
            <FieldRow
              label="Subdomain"
              value={
                <code className="rounded bg-muted px-1.5 py-0.5">
                  {studio.slug}.fitstudio.app
                </code>
              }
            />
            <FieldRow label="Country" value={studio.country} />
            <FieldRow label="Language" value={studio.language.toUpperCase()} />
            <FieldRow label="Timezone" value={studio.timezone} />
            <FieldRow label="Currency" value={studio.currency} />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Branding</CardTitle>
          <CardDescription>
            Colours and assets used across the member portal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <span
              className="h-10 w-10 rounded-md border"
              style={{ backgroundColor: studio.primaryColor }}
              aria-hidden
            />
            <div className="text-sm">
              <p className="font-medium">Primary colour</p>
              <p className="text-muted-foreground">{studio.primaryColor}</p>
            </div>
          </div>
          <Separator />
          <div className="text-sm">
            <p className="font-medium">Logo URL</p>
            <p className="text-muted-foreground break-all">
              {studio.logoUrl ?? "Not set"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tax &amp; invoicing</CardTitle>
          <CardDescription>
            Country-specific compliance settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="divide-y">
            <FieldRow
              label="VAT / Tax number"
              value={studio.vatNumber ?? "Not provided"}
            />
            <FieldRow
              label="Verifactu (Spain)"
              value={
                <Badge
                  variant={studio.verifactuEnabled ? "default" : "outline"}
                >
                  {studio.verifactuEnabled ? "Enabled" : "Disabled"}
                </Badge>
              }
            />
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
