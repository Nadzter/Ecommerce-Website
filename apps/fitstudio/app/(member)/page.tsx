import { auth } from "@clerk/nextjs/server";

import { ClassCard } from "@/components/member/class-card";
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

export const dynamic = "force-dynamic";

interface UpcomingClass {
  id: string;
  title: string;
  description: string | null;
  startTime: Date;
  endTime: Date;
  capacity: number;
  location: "INPERSON" | "ONLINE" | "HYBRID";
  instructorName: string;
  seatsLeft: number;
}

async function loadUpcomingClasses(studioId: string): Promise<UpcomingClass[]> {
  const rows = await prisma.class.findMany({
    where: { studioId, startTime: { gte: new Date() } },
    orderBy: { startTime: "asc" },
    include: {
      instructor: { select: { firstName: true, lastName: true } },
      _count: { select: { bookings: true } },
    },
    take: 12,
  });

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    startTime: row.startTime,
    endTime: row.endTime,
    capacity: row.capacity,
    location: row.location,
    instructorName:
      [row.instructor.firstName, row.instructor.lastName]
        .filter(Boolean)
        .join(" ") || "Instructor",
    seatsLeft: Math.max(row.capacity - row._count.bookings, 0),
  }));
}

interface MyBookings {
  upcoming: Array<{
    id: string;
    classTitle: string;
    startTime: Date;
  }>;
  creditsRemaining: number;
}

async function loadMyBookings(
  clerkId: string,
  studioId: string,
): Promise<MyBookings | null> {
  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, studioId: true },
  });
  if (!user || user.studioId !== studioId) return null;

  const [bookings, creditsUsedAgg, latestPack] = await Promise.all([
    prisma.booking.findMany({
      where: {
        userId: user.id,
        status: "CONFIRMED",
        class: { startTime: { gte: new Date() } },
      },
      include: { class: { select: { title: true, startTime: true } } },
      orderBy: { class: { startTime: "asc" } },
      take: 5,
    }),
    prisma.booking.aggregate({
      where: { userId: user.id, status: "CONFIRMED" },
      _sum: { creditsUsed: true },
    }),
    prisma.payment.findFirst({
      where: {
        userId: user.id,
        status: "COMPLETED",
        membership: { type: "CLASS_PACK" },
      },
      orderBy: { createdAt: "desc" },
      include: { membership: { select: { classCount: true } } },
    }),
  ]);

  const totalCredits = latestPack?.membership?.classCount ?? 0;
  const used = creditsUsedAgg._sum.creditsUsed ?? 0;
  const creditsRemaining = Math.max(totalCredits - used, 0);

  return {
    upcoming: bookings.map((b) => ({
      id: b.id,
      classTitle: b.class.title,
      startTime: b.class.startTime,
    })),
    creditsRemaining,
  };
}

export default async function MemberHomePage(): Promise<JSX.Element> {
  const studio = await getCurrentStudio();
  const { userId } = auth();

  const [classes, mine] = await Promise.all([
    loadUpcomingClasses(studio.id),
    userId ? loadMyBookings(userId, studio.id) : Promise.resolve(null),
  ]);

  return (
    <div className="space-y-10">
      <section className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Book your next class
        </h1>
        <p className="text-muted-foreground">
          Browse the upcoming schedule at {studio.name}.
        </p>
      </section>

      {mine ? (
        <section className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Your upcoming bookings</CardTitle>
              <CardDescription>
                Showing the next {mine.upcoming.length || 0} confirmed
                bookings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {mine.upcoming.length === 0 ? (
                <p className="text-muted-foreground">
                  You have no bookings yet. Reserve a class below to get
                  started.
                </p>
              ) : (
                <ul className="divide-y">
                  {mine.upcoming.map((booking) => (
                    <li
                      key={booking.id}
                      className="flex items-center justify-between py-2"
                    >
                      <span className="font-medium">{booking.classTitle}</span>
                      <span className="text-muted-foreground">
                        {formatDateTime(booking.startTime, studio.timezone)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Credits remaining</CardTitle>
              <CardDescription>
                From your active class-pack membership.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tabular-nums">
                {mine.creditsRemaining}
              </p>
            </CardContent>
          </Card>
        </section>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Upcoming classes</h2>
        {classes.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No classes scheduled yet</CardTitle>
              <CardDescription>
                Check back soon — {studio.name} is preparing their next
                timetable.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {classes.map((session) => (
              <ClassCard
                key={session.id}
                title={session.title}
                description={session.description}
                instructorName={session.instructorName}
                startTime={session.startTime}
                endTime={session.endTime}
                location={session.location}
                seatsLeft={session.seatsLeft}
                capacity={session.capacity}
                timezone={studio.timezone}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
