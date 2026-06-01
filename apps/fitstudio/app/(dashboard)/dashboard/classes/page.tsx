import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getCurrentStudio } from "@/lib/tenant";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Classes" };

export const dynamic = "force-dynamic";

export default async function ClassesPage(): Promise<JSX.Element> {
  const studio = await getCurrentStudio();
  const classes = await prisma.class.findMany({
    where: { studioId: studio.id, startTime: { gte: new Date() } },
    orderBy: { startTime: "asc" },
    include: {
      instructor: { select: { firstName: true, lastName: true } },
      _count: { select: { bookings: true } },
    },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Classes</h1>
        <p className="text-sm text-muted-foreground">
          Upcoming sessions for {studio.name}, sorted by start time.
        </p>
      </div>

      {classes.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No classes scheduled</CardTitle>
            <CardDescription>
              Once you add a class it will appear here and on the public
              booking page.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {classes.map((session) => {
            const fullName =
              [session.instructor.firstName, session.instructor.lastName]
                .filter(Boolean)
                .join(" ") || "Instructor";
            const seatsLeft = Math.max(
              session.capacity - session._count.bookings,
              0,
            );
            return (
              <Card key={session.id}>
                <CardHeader className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">{session.title}</CardTitle>
                    <Badge variant="secondary">{session.location}</Badge>
                  </div>
                  <CardDescription>
                    {formatDateTime(session.startTime, studio.timezone)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>
                    <span className="text-muted-foreground">Instructor:</span>{" "}
                    {fullName}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Bookings:</span>{" "}
                    {session._count.bookings} / {session.capacity}{" "}
                    <span className="text-muted-foreground">
                      ({seatsLeft} seats left)
                    </span>
                  </p>
                  {session.description ? (
                    <p className="text-muted-foreground">
                      {session.description}
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
