"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchJson } from "@/lib/api-client";

interface BookingRow {
  id: string;
  status: "CONFIRMED" | "WAITLISTED" | "CANCELLED";
  checkedInAt: string | null;
  createdAt: string;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
}

interface ClassBookingsListProps {
  classId: string;
  bookings: readonly BookingRow[];
}

export function ClassBookingsList({
  classId,
  bookings,
}: ClassBookingsListProps): JSX.Element {
  const queryClient = useQueryClient();

  const checkInMutation = useMutation({
    mutationFn: (bookingId: string) =>
      fetchJson<{ alreadyCheckedIn: boolean }>(
        `/api/bookings/${bookingId}/checkin`,
        { method: "POST" },
      ),
    onMutate: async (bookingId) => {
      await queryClient.cancelQueries({ queryKey: ["class-detail", classId] });
      // Optimistic UI: surface the green check-in icon instantly while the
      // request is in flight.
      const previous = bookings;
      queryClient.setQueryData(["class-detail", classId], (data: unknown) => {
        if (!data || typeof data !== "object") return data;
        return {
          ...data,
          class: {
            ...(data as { class: { bookings: BookingRow[] } }).class,
            bookings: (data as { class: { bookings: BookingRow[] } }).class.bookings.map(
              (entry) =>
                entry.id === bookingId
                  ? { ...entry, checkedInAt: new Date().toISOString() }
                  : entry,
            ),
          },
        };
      });
      return { previous };
    },
    onError: (error, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(["class-detail", classId], ctx.previous);
      }
      toast.error(error instanceof Error ? error.message : "Check-in failed");
    },
    onSuccess: (result) => {
      toast.success(
        result.alreadyCheckedIn ? "Already checked in" : "Checked in",
      );
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["class-detail", classId] }),
  });

  if (bookings.length === 0) {
    return (
      <p className="rounded-md border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        No bookings yet. Share the public booking page to start filling seats.
      </p>
    );
  }

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Booked</TableHead>
            <TableHead>Check-in</TableHead>
            <TableHead className="text-right" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((booking) => {
            const fullName =
              [booking.user.firstName, booking.user.lastName]
                .filter(Boolean)
                .join(" ") || booking.user.email;
            const isCheckedIn = Boolean(booking.checkedInAt);
            return (
              <TableRow key={booking.id}>
                <TableCell>
                  <div className="font-medium">{fullName}</div>
                  <div className="text-xs text-muted-foreground">
                    {booking.user.email}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      booking.status === "CONFIRMED"
                        ? "default"
                        : booking.status === "WAITLISTED"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {booking.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(booking.createdAt).toLocaleString()}
                </TableCell>
                <TableCell>
                  {isCheckedIn ? (
                    <span className="inline-flex items-center gap-1 text-sm text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" />
                      Checked in
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {booking.status === "CONFIRMED" && !isCheckedIn ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={checkInMutation.isPending}
                      onClick={() => checkInMutation.mutate(booking.id)}
                    >
                      Check in
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
