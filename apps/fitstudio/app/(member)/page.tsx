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
import { tryGetCurrentStudio } from "@/lib/tenant";
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

  const now = new Date();
  const [bookings, unlimited, userRow] = await Promise.all([
    prisma.booking.findMany({
      where: {
        userId: user.id,
        status: "CONFIRMED",
        class: { startTime: { gte: now } },
      },
      include: { class: { select: { title: true, startTime: true } } },
      orderBy: { class: { startTime: "asc" } },
      take: 5,
    }),
    prisma.userMembership.findFirst({
      where: {
        userId: user.id,
        studioId,
        isActive: true,
        startsAt: { lte: now },
        OR: [{ endsAt: null }, { endsAt: { gte: now } }],
        membership: { type: "UNLIMITED" },
      },
      select: { id: true },
    }),
    prisma.user.findUnique({
      where: { id: user.id },
      select: { creditsBalance: true },
    }),
  ]);

  const creditsRemaining = unlimited
    ? Number.POSITIVE_INFINITY
    : userRow?.creditsBalance ?? 0;

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
  const studio = await tryGetCurrentStudio();
  if (!studio) return <div />;
  const { userId } = auth();

  const [classes, mine] = await Promise.all([
    loadUpcomingClasses(studio.id),
    userId ? loadMyBookings(userId, studio.id) : Promise.resolve(null),
  ]);

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-background via-background to-muted/40 p-8 sm:p-12">
        <div className="relative max-w-2xl space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {studio.name}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Book your next class
          </h1>
          <p className="text-base text-muted-foreground">
            Reserve a spot in the upcoming schedule — secure your machine, your
            time slot, and your favourite instructor in seconds.
          </p>
        </div>
        <div
          className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full opacity-10 blur-3xl"
          style={{ backgroundColor: studio.primaryColor }}
          aria-hidden
        />
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
                {Number.isFinite(mine.creditsRemaining)
                  ? mine.creditsRemaining
                  : "∞"}
              </p>
            </CardContent>
          </Card>
        </section>
      ) : null}

      <section className="space-y-6">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Upcoming classes
          </h2>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {classes.length} scheduled
          </p>
        </div>
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
