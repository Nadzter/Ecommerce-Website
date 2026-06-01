"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { fetchJson, FetchError } from "@/lib/api-client";

interface BookButtonProps {
  classId: string;
  isFull: boolean;
  disabled?: boolean;
  label?: string;
  onSuccess?: () => void;
}

interface BookingResponse {
  booking: {
    id: string;
    status: "CONFIRMED" | "WAITLISTED";
    waitlistPosition: number | null;
  };
}

export function BookButton({
  classId,
  isFull,
  disabled,
  label,
  onSuccess,
}: BookButtonProps): JSX.Element {
  const queryClient = useQueryClient();
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: () =>
      fetchJson<BookingResponse>("/api/bookings", {
        method: "POST",
        body: JSON.stringify({ classId }),
      }),
    onSuccess: (data) => {
      const status = data.booking.status;
      if (status === "WAITLISTED") {
        toast.success(
          `Added to waitlist (#${data.booking.waitlistPosition ?? "?"})`,
        );
      } else {
        toast.success("Booking confirmed");
      }
      queryClient.invalidateQueries({ queryKey: ["member-classes"] });
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
      onSuccess?.();
    },
    onError: (error) => {
      if (error instanceof FetchError && error.status === 422) {
        toast.error(error.body.message, {
          action: {
            label: "Buy membership",
            onClick: () => router.push("/memberships"),
          },
        });
        return;
      }
      toast.error(error instanceof Error ? error.message : "Booking failed");
    },
  });

  const buttonLabel =
    label ?? (isFull ? "Join waitlist" : "Book");

  return (
    <Button
      type="button"
      size="sm"
      variant={isFull ? "secondary" : "default"}
      disabled={disabled || mutation.isPending}
      onClick={() => mutation.mutate()}
    >
      {mutation.isPending ? "Saving..." : buttonLabel}
    </Button>
  );
}
