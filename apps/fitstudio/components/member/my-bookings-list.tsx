"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookingQr } from "@/components/member/booking-qr";
import { CancelBookingButton } from "@/components/member/cancel-booking-button";
import { fetchJson } from "@/lib/api-client";
import { formatDateTime } from "@/lib/utils";
import { canMemberCancel } from "@/lib/booking-rules";

interface MyBookingsResponse {
  bookings: Array<{
    id: string;
    status: "CONFIRMED" | "WAITLISTED" | "CANCELLED";
    checkedInAt: string | null;
    cancelledAt: string | null;
    class: {
      id: string;
      title: string;
      startTime: string;
      endTime: string;
      location: "INPERSON" | "ONLINE" | "HYBRID";
      sessionType: "GROUP" | "PRIVATE" | "DUET" | "TRIO";
      zoomLink: string | null;
      cancelledAt: string | null;
      instructor: {
        id: string;
        firstName: string | null;
        lastName: string | null;
      };
    };
  }>;
  memberships: Array<{
    id: string;
    name: string;
    type: "UNLIMITED" | "CLASS_PACK" | "DROP_IN";
    creditsRemaining: number | null;
    endsAt: string | null;
  }>;
}

interface MyBookingsListProps {
  studioId: string;
  studioTimezone: string;
}

export function MyBookingsList({
  studioId,
  studioTimezone,
}: MyBookingsListProps): JSX.Element {
  const [scope, setScope] = React.useState<"upcoming" | "past">("upcoming");
  const query = useQuery({
    queryKey: ["my-bookings", scope],
    queryFn: () =>
      fetchJson<MyBookingsResponse>(
        `/api/members/me/bookings?scope=${scope}`,
      ),
  });

  return (
    <div className="space-y-6">
      {query.data?.memberships?.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {query.data.memberships.map((entry) => (
            <Card key={entry.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{entry.name}</CardTitle>
                <CardDescription>{entry.type}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm">
                {entry.type === "UNLIMITED" ? (
                  <p className="font-medium">Unlimited access</p>
                ) : (
                  <p>
                    <span className="text-2xl font-semibold">
                      {entry.creditsRemaining ?? 0}
                    </span>{" "}
                    <span className="text-muted-foreground">
                      credits remaining
                    </span>
                  </p>
                )}
                {entry.endsAt ? (
                  <p className="text-xs text-muted-foreground">
                    Expires {new Date(entry.endsAt).toLocaleDateString()}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      <Tabs
        value={scope}
        onValueChange={(value) => setScope(value as typeof scope)}
      >
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>

        <TabsContent value={scope} className="space-y-3">
          {query.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <Skeleton key={idx} className="h-20 w-full" />
              ))}
            </div>
          ) : query.isError ? (
            <Card>
              <CardHeader>
                <CardTitle>Could not load bookings</CardTitle>
                <CardDescription>
                  {query.error instanceof Error
                    ? query.error.message
                    : "Try again in a moment."}
                </CardDescription>
              </CardHeader>
            </Card>
          ) : query.data && query.data.bookings.length > 0 ? (
            query.data.bookings.map((booking) => {
              const start = new Date(booking.class.startTime);
              const cancellable =
                scope === "upcoming" &&
                booking.status === "CONFIRMED" &&
                !booking.class.cancelledAt &&
                canMemberCancel(start);
              const instructorName =
                [
                  booking.class.instructor.firstName,
                  booking.class.instructor.lastName,
                ]
                  .filter(Boolean)
                  .join(" ") || "Instructor";
              return (
                <Card key={booking.id}>
                  <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                    <div>
                      <CardTitle className="text-base">
                        {booking.class.title}
                      </CardTitle>
                      <CardDescription>
                        {formatDateTime(start, studioTimezone)} ·{" "}
                        {instructorName}
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={
                          booking.class.cancelledAt
                            ? "destructive"
                            : booking.status === "CONFIRMED"
                              ? "default"
                              : booking.status === "WAITLISTED"
                                ? "secondary"
                                : "outline"
                        }
                      >
                        {booking.class.cancelledAt
                          ? "CLASS CANCELLED"
                          : booking.status}
                      </Badge>
                      {booking.checkedInAt ? (
                        <Badge variant="outline">Checked in</Badge>
                      ) : null}
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <div className="text-muted-foreground">
                      {booking.class.location}
                      {booking.class.zoomLink ? (
                        <>
                          {" · "}
                          <a
                            href={booking.class.zoomLink}
                            className="text-primary hover:underline"
                            target="_blank"
                            rel="noreferrer"
                          >
                            Zoom link
                          </a>
                        </>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      {booking.status === "CONFIRMED" &&
                      !booking.class.cancelledAt ? (
                        <BookingQr
                          bookingId={booking.id}
                          classId={booking.class.id}
                          studioId={studioId}
                          classTitle={booking.class.title}
                        />
                      ) : null}
                      {cancellable ? (
                        <CancelBookingButton bookingId={booking.id} />
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>
                  {scope === "upcoming"
                    ? "No upcoming bookings"
                    : "No past bookings"}
                </CardTitle>
                <CardDescription>
                  {scope === "upcoming"
                    ? "Head to the schedule to reserve a class."
                    : "Bookings will appear here after their start time has passed."}
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
