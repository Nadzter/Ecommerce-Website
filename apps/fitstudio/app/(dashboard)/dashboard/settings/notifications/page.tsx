import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { NotificationSettingsForm } from "@/components/notifications/notification-settings-form";
import { requireOwner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentStudio } from "@/lib/tenant";

export const metadata: Metadata = { title: "Notifications" };

export const dynamic = "force-dynamic";

const DEFAULT_ENABLED = [
  "booking_confirmed",
  "booking_reminder",
  "waitlist_promoted",
  "booking_cancelled",
  "payment_received",
  "membership_expiring",
] as const;

const AVAILABLE = [
  "booking_confirmed",
  "booking_reminder",
  "waitlist_promoted",
  "booking_cancelled",
  "payment_received",
  "membership_expiring",
  "win_back",
] as const;

export default async function NotificationsSettingsPage(): Promise<JSX.Element> {
  const ctx = await requireOwner();
  const studio = await getCurrentStudio();
  const existing = await prisma.studioNotificationSettings.findUnique({
    where: { studioId: studio.id },
  });

  return (
    <div className="space-y-6">
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

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Notifications
        </h1>
        <p className="text-sm text-muted-foreground">
          Control which automatic WhatsApp / email updates {studio.name}{" "}
          sends to members.
        </p>
      </div>

      <NotificationSettingsForm
        initial={{
          enabledTypes:
            (existing?.enabledTypes as (typeof AVAILABLE)[number][] | undefined) ??
            Array.from(DEFAULT_ENABLED),
          defaultLanguage:
            (existing?.defaultLanguage as "es" | "en" | "ar" | undefined) ??
            studio.language,
        }}
        available={AVAILABLE}
        ownerHasPhone={Boolean(ctx.user.phone)}
      />
    </div>
  );
}
