import type { Metadata } from "next";

import { ClassFormDialog } from "@/components/dashboard/class-form";
import { ClassesTable } from "@/components/dashboard/classes-table";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentStudio } from "@/lib/tenant";

export const metadata: Metadata = { title: "Classes" };

export const dynamic = "force-dynamic";

export default async function ClassesPage(): Promise<JSX.Element> {
  await requireStaff();
  const studio = await getCurrentStudio();
  const instructors = await prisma.user.findMany({
    where: { studioId: studio.id, role: { in: ["OWNER", "STAFF"] } },
    select: { id: true, firstName: true, lastName: true },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Classes</h1>
          <p className="text-sm text-muted-foreground">
            Manage the schedule for {studio.name}.
          </p>
        </div>
        <ClassFormDialog instructors={instructors} />
      </div>

      <ClassesTable
        studioTimezone={studio.timezone}
        instructors={instructors}
      />
    </div>
  );
}
