"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { fetchJson } from "@/lib/api-client";

interface CancelBookingButtonProps {
  bookingId: string;
  disabled?: boolean;
}

export function CancelBookingButton({
  bookingId,
  disabled,
}: CancelBookingButtonProps): JSX.Element {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () =>
      fetchJson(`/api/bookings/${bookingId}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Booking cancelled");
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["member-classes"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Cancel failed"),
  });

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={disabled || mutation.isPending}
      onClick={() => mutation.mutate()}
    >
      {mutation.isPending ? "Cancelling..." : "Cancel"}
    </Button>
  );
}
