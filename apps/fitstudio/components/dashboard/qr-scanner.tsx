"use client";

import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Camera, CheckCircle2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { fetchJson } from "@/lib/api-client";

interface QrPayload {
  bookingId?: unknown;
  studioId?: unknown;
  classId?: unknown;
}

interface CheckInResponse {
  bookingId: string;
  alreadyCheckedIn: boolean;
  class: { id: string; title: string };
  user: { firstName: string | null; lastName: string | null };
}

interface QrScannerProps {
  studioId: string;
}

const SCANNER_ELEMENT_ID = "fitstudio-qr-scanner";

interface ScanRecord {
  bookingId: string;
  memberName: string;
  className: string;
  alreadyCheckedIn: boolean;
  at: Date;
}

/**
 * Parse the QR payload that `BookingQrCard` encodes. We accept the canonical
 * `{ bookingId, studioId, classId }` JSON shape and also degrade to a plain
 * booking id string so older codes (or hand-pasted ids) still work.
 */
function parsePayload(raw: string): { bookingId: string } | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    const parsed = JSON.parse(trimmed) as QrPayload;
    if (typeof parsed.bookingId === "string" && parsed.bookingId.length > 0) {
      return { bookingId: parsed.bookingId };
    }
  } catch {
    // Not JSON — fall through to plain-string handling.
  }

  if (/^[a-z0-9_-]{8,}$/i.test(trimmed)) {
    return { bookingId: trimmed };
  }
  return null;
}

export function QrScanner({ studioId }: QrScannerProps): JSX.Element {
  const [scanning, setScanning] = React.useState(false);
  const [history, setHistory] = React.useState<ScanRecord[]>([]);
  const scannerRef = React.useRef<{ stop: () => Promise<void> } | null>(null);
  const lastScanRef = React.useRef<{ value: string; at: number } | null>(null);

  const checkInMutation = useMutation({
    mutationFn: (bookingId: string) =>
      fetchJson<CheckInResponse>(`/api/bookings/${bookingId}/checkin`, {
        method: "POST",
      }),
    onSuccess: (result) => {
      const name =
        [result.user.firstName, result.user.lastName]
          .filter(Boolean)
          .join(" ") || "Member";
      setHistory((prev) => [
        {
          bookingId: result.bookingId,
          memberName: name,
          className: result.class.title,
          alreadyCheckedIn: result.alreadyCheckedIn,
          at: new Date(),
        },
        ...prev.slice(0, 9),
      ]);
      if (result.alreadyCheckedIn) {
        toast.info(`${name} was already checked in to ${result.class.title}`);
      } else {
        toast.success(`Checked in: ${name} → ${result.class.title}`);
      }
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Check-in failed"),
  });

  const stopScanner = React.useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {
        // Browser may have already released the camera.
      }
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  const startScanner = React.useCallback(async () => {
    if (scannerRef.current) return;
    setScanning(true);
    const { Html5Qrcode } = await import("html5-qrcode");
    const instance = new Html5Qrcode(SCANNER_ELEMENT_ID, /* verbose */ false);
    try {
      await instance.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          const now = Date.now();
          // Debounce duplicate frames coming in tens of ms apart.
          if (
            lastScanRef.current &&
            lastScanRef.current.value === decodedText &&
            now - lastScanRef.current.at < 1500
          ) {
            return;
          }
          lastScanRef.current = { value: decodedText, at: now };
          const parsed = parsePayload(decodedText);
          if (!parsed) {
            toast.error("Unrecognised QR payload");
            return;
          }
          checkInMutation.mutate(parsed.bookingId);
        },
        () => {
          // html5-qrcode emits per-frame "not found" errors which we ignore.
        },
      );
      scannerRef.current = { stop: () => instance.stop().then(() => instance.clear()) };
    } catch (error) {
      console.error("[qr-scanner] failed to start", error);
      toast.error(
        error instanceof Error
          ? `Camera error: ${error.message}`
          : "Camera not available",
      );
      setScanning(false);
    }
  }, [checkInMutation]);

  React.useEffect(() => {
    return () => {
      void stopScanner();
    };
  }, [stopScanner]);

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">QR scanner</p>
            <p className="text-xs text-muted-foreground">
              Tenant: <code>{studioId}</code>
            </p>
          </div>
          {scanning ? (
            <Button variant="outline" size="sm" onClick={() => void stopScanner()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Stop
            </Button>
          ) : (
            <Button size="sm" onClick={() => void startScanner()}>
              <Camera className="mr-2 h-4 w-4" />
              Start scanner
            </Button>
          )}
        </div>
        <div
          id={SCANNER_ELEMENT_ID}
          className="mt-4 aspect-square w-full overflow-hidden rounded-md bg-black"
        />
        {!scanning ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Permission to access the camera is requested when the scanner starts.
          </p>
        ) : null}
      </div>

      <div className="rounded-md border bg-card">
        <div className="border-b px-4 py-2 text-sm font-medium">
          Recent check-ins
        </div>
        {history.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            Scanned check-ins will appear here.
          </p>
        ) : (
          <ul className="divide-y">
            {history.map((entry) => (
              <li
                key={`${entry.bookingId}-${entry.at.getTime()}`}
                className="flex items-center justify-between px-4 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">{entry.memberName}</p>
                  <p className="text-muted-foreground">{entry.className}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {entry.alreadyCheckedIn ? (
                    <span>Already in</span>
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  )}
                  <span>{entry.at.toLocaleTimeString()}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
