import { redirect } from "next/navigation";

import { MyBookingsList } from "@/components/member/my-bookings-list";
import { getAuthContext } from "@/lib/auth";
import { getCurrentStudio } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export const metadata = { title: "My bookings" };

export default async function MyBookingsPage(): Promise<JSX.Element> {
  const studio = await getCurrentStudio();
  const ctx = await getAuthContext();
  if (!ctx) {
    redirect("/sign-in");
  }
  if (ctx.studioId !== studio.id) {
    redirect("/sign-in");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My bookings</h1>
        <p className="text-sm text-muted-foreground">
          Upcoming and past sessions at {studio.name}.
        </p>
      </div>

      <MyBookingsList studioId={studio.id} studioTimezone={studio.timezone} />
    </div>
  );
}
