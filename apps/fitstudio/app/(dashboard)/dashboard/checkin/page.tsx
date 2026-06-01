import type { Metadata } from "next";

import { QrScanner } from "@/components/dashboard/qr-scanner";
import { requireStaff } from "@/lib/auth";
import { getCurrentStudio } from "@/lib/tenant";

export const metadata: Metadata = { title: "Check-in" };

export const dynamic = "force-dynamic";

export default async function CheckinPage(): Promise<JSX.Element> {
  await requireStaff();
  const studio = await getCurrentStudio();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Check-in</h1>
        <p className="text-sm text-muted-foreground">
          Scan a member's QR code to mark their booking as checked-in.
        </p>
      </div>

      <QrScanner studioId={studio.id} />
    </div>
  );
}
