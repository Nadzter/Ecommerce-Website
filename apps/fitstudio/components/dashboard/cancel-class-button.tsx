"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { fetchJson } from "@/lib/api-client";

interface CancelClassButtonProps {
  classId: string;
}

export function CancelClassButton({
  classId,
}: CancelClassButtonProps): JSX.Element {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      fetchJson<{ cancelledBookings: number }>(
        `/api/classes/${classId}`,
        { method: "DELETE" },
      ),
    onSuccess: (result) => {
      toast.success(
        `Class cancelled — ${result.cancelledBookings} booking(s) notified.`,
      );
      setOpen(false);
      router.push("/dashboard/classes");
      router.refresh();
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Cancel failed"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">Cancel class</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel this class?</DialogTitle>
          <DialogDescription>
            Existing bookings will be cancelled and credits refunded. Members
            will receive a notification.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Keep
          </Button>
          <Button
            variant="destructive"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Cancelling..." : "Cancel class"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
