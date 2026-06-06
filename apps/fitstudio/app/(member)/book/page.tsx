import { startOfWeek } from "date-fns";

import { WeeklyCalendar } from "@/components/member/weekly-calendar";
import { prisma } from "@/lib/prisma";
import { getCurrentStudio } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export const metadata = { title: "Book a class" };

export default async function BookPage(): Promise<JSX.Element> {
  const studio = await getCurrentStudio();
  const instructors = await prisma.user.findMany({
    where: { studioId: studio.id, role: { in: ["OWNER", "STAFF"] } },
    select: { id: true, firstName: true, lastName: true },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Weekly schedule
        </h1>
        <p className="text-sm text-muted-foreground">
          Browse and book classes at {studio.name}.
        </p>
      </div>

      <WeeklyCalendar
        studioTimezone={studio.timezone}
        instructors={instructors}
        initialWeekStart={startOfWeek(new Date(), { weekStartsOn: 1 })}
      />
    </div>
  );
}
