"use client";

import * as React from "react";
import QRCode from "react-qr-code";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface BookingQrProps {
  bookingId: string;
  studioId: string;
  classId: string;
  classTitle: string;
}

/**
 * The QR payload encodes the trio `(bookingId, studioId, classId)` so the
 * scanner at /dashboard/checkin can validate the tenant context before
 * hitting the API. The booking ID alone is also sufficient on the server
 * because every booking is unique to its studio.
 */
export function BookingQr({
  bookingId,
  studioId,
  classId,
  classTitle,
}: BookingQrProps): JSX.Element {
  const payload = React.useMemo(
    () => JSON.stringify({ bookingId, studioId, classId }),
    [bookingId, studioId, classId],
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Show QR
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle>Check-in QR</DialogTitle>
          <DialogDescription>{classTitle}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-center bg-white p-4">
          <QRCode value={payload} size={200} viewBox="0 0 256 256" />
        </div>
        <p className="text-center text-xs text-muted-foreground">
          Show this code at the front desk to check in.
        </p>
      </DialogContent>
    </Dialog>
  );
}
