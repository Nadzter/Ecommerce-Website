"use client";

import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlarmClock,
  Bell,
  CheckCircle2,
  CreditCard,
  Heart,
  ListChecks,
  MessageCircle,
  TimerReset,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { fetchJson } from "@/lib/api-client";

type NotificationType =
  | "booking_confirmed"
  | "booking_reminder"
  | "waitlist_promoted"
  | "booking_cancelled"
  | "payment_received"
  | "membership_expiring"
  | "win_back";

const TYPE_META: Record<
  NotificationType,
  { title: string; description: string; icon: LucideIcon }
> = {
  booking_confirmed: {
    title: "Booking confirmed",
    description: "Sent the moment a member's booking is confirmed.",
    icon: CheckCircle2,
  },
  booking_reminder: {
    title: "Class reminder",
    description: "1 hour before the class starts.",
    icon: AlarmClock,
  },
  waitlist_promoted: {
    title: "Waitlist promotion",
    description: "When a seat opens up and a waitlisted member is promoted.",
    icon: TimerReset,
  },
  booking_cancelled: {
    title: "Booking cancelled",
    description: "Confirms a cancellation and any credit refund.",
    icon: Bell,
  },
  payment_received: {
    title: "Payment received",
    description: "Includes the invoice link for download.",
    icon: CreditCard,
  },
  membership_expiring: {
    title: "Membership expiring",
    description: "Sent 7 days before a recurring plan ends.",
    icon: ListChecks,
  },
  win_back: {
    title: "Win-back outreach",
    description: "Manual nudge to members who haven't booked recently.",
    icon: Heart,
  },
};

interface NotificationSettings {
  enabledTypes: NotificationType[];
  defaultLanguage: "es" | "en" | "ar";
}

interface NotificationSettingsFormProps {
  initial: NotificationSettings;
  available: readonly NotificationType[];
  ownerHasPhone: boolean;
}

export function NotificationSettingsForm({
  initial,
  available,
  ownerHasPhone,
}: NotificationSettingsFormProps): JSX.Element {
  const [enabled, setEnabled] = React.useState<Set<NotificationType>>(
    () => new Set(initial.enabledTypes),
  );
  const [language, setLanguage] = React.useState<NotificationSettings["defaultLanguage"]>(
    initial.defaultLanguage,
  );

  const saveMutation = useMutation({
    mutationFn: (payload: {
      enabledTypes?: NotificationType[];
      defaultLanguage?: NotificationSettings["defaultLanguage"];
    }) =>
      fetchJson<{ settings: NotificationSettings }>(
        "/api/notifications/settings",
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        },
      ),
    onSuccess: () => toast.success("Notification settings saved"),
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Save failed"),
  });

  const testMutation = useMutation({
    mutationFn: () =>
      fetchJson<{ enqueued: boolean }>("/api/notifications/test", {
        method: "POST",
      }),
    onSuccess: () =>
      toast.success("Test message queued — check your WhatsApp shortly."),
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Test failed"),
  });

  const toggleType = (type: NotificationType): void => {
    setEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      saveMutation.mutate({ enabledTypes: Array.from(next) });
      return next;
    });
  };

  const onLanguageChange = (value: string): void => {
    const lang = value as NotificationSettings["defaultLanguage"];
    setLanguage(lang);
    saveMutation.mutate({ defaultLanguage: lang });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="text-base">Default language</CardTitle>
            <CardDescription>
              Used when a member has no preferred language on file.
            </CardDescription>
          </div>
          <Select value={language} onValueChange={onLanguageChange}>
            <SelectTrigger className="w-44 cursor-pointer transition-colors duration-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="es">Español</SelectItem>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="ar">العربية</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="text-base">Test WhatsApp delivery</CardTitle>
            <CardDescription>
              Send a sample booking_confirmed to your phone via the live
              worker queue.
            </CardDescription>
          </div>
          <Button
            type="button"
            size="sm"
            disabled={!ownerHasPhone || testMutation.isPending}
            onClick={() => testMutation.mutate()}
            className="cursor-pointer gap-2 transition-colors duration-200"
          >
            <MessageCircle className="h-4 w-4" aria-hidden />
            {testMutation.isPending ? "Queuing…" : "Send test"}
          </Button>
        </CardHeader>
        {!ownerHasPhone ? (
          <CardContent className="text-xs text-muted-foreground">
            Add a phone number to your profile in Clerk to enable the test.
          </CardContent>
        ) : null}
      </Card>

      <div className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Notification types
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {available.map((type) => {
            const meta = TYPE_META[type];
            const Icon = meta.icon;
            const isOn = enabled.has(type);
            return (
              <Card
                key={type}
                className={`transition-shadow duration-200 ${
                  isOn ? "border-primary/30 bg-primary/5" : ""
                } hover:shadow-sm`}
              >
                <CardContent className="flex items-start justify-between gap-3 p-4">
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-md ${
                        isOn
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <div>
                      <Label
                        htmlFor={`toggle-${type}`}
                        className="cursor-pointer text-sm font-semibold"
                      >
                        {meta.title}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {meta.description}
                      </p>
                    </div>
                  </div>
                  <Switch
                    id={`toggle-${type}`}
                    checked={isOn}
                    onCheckedChange={() => toggleType(type)}
                    className="cursor-pointer"
                    aria-label={`Toggle ${meta.title}`}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
