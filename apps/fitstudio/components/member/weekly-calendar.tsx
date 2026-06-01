"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  addDays,
  endOfDay,
  format,
  isSameDay,
  startOfDay,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { BookButton } from "@/components/member/book-button";
import { fetchJson } from "@/lib/api-client";
import { formatDateTime } from "@/lib/utils";

interface InstructorOption {
  id: string;
  firstName: string | null;
  lastName: string | null;
}

interface ApiClass {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  capacity: number;
  booked: number;
  instructor: InstructorOption;
  location: "INPERSON" | "ONLINE" | "HYBRID";
  sessionType: "GROUP" | "PRIVATE" | "DUET" | "TRIO";
  equipment: string[];
  cancelledAt: string | null;
}

interface WeeklyCalendarProps {
  studioTimezone: string;
  instructors: readonly InstructorOption[];
  initialWeekStart: Date;
}

export function WeeklyCalendar({
  studioTimezone,
  instructors,
  initialWeekStart,
}: WeeklyCalendarProps): JSX.Element {
  const [weekStart, setWeekStart] = React.useState<Date>(initialWeekStart);
  const [instructorId, setInstructorId] = React.useState<string>("all");
  const [sessionType, setSessionType] = React.useState<string>("all");

  const weekEnd = endOfDay(addDays(weekStart, 6));
  const queryString = React.useMemo(() => {
    const params = new URLSearchParams({
      from: weekStart.toISOString(),
      to: weekEnd.toISOString(),
    });
    if (instructorId !== "all") params.set("instructorId", instructorId);
    if (sessionType !== "all") params.set("sessionType", sessionType);
    return params.toString();
  }, [weekStart, weekEnd, instructorId, sessionType]);

  const query = useQuery({
    queryKey: ["member-classes", queryString],
    queryFn: () =>
      fetchJson<{ classes: ApiClass[] }>(`/api/classes?${queryString}`),
  });

  const days = React.useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart],
  );

  const classesByDay = React.useMemo(() => {
    const map = new Map<string, ApiClass[]>();
    for (const day of days) {
      map.set(format(day, "yyyy-MM-dd"), []);
    }
    if (query.data) {
      for (const session of query.data.classes) {
        const date = format(new Date(session.startTime), "yyyy-MM-dd");
        const bucket = map.get(date);
        if (bucket) bucket.push(session);
      }
      for (const bucket of map.values()) {
        bucket.sort(
          (a, b) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
        );
      }
    }
    return map;
  }, [days, query.data]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Previous week"
            onClick={() => setWeekStart((prev) => addDays(prev, -7))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-44 text-center text-sm font-medium">
            Week of {format(weekStart, "d MMM yyyy")}
          </div>
          <Button
            variant="outline"
            size="icon"
            aria-label="Next week"
            onClick={() => setWeekStart((prev) => addDays(prev, 7))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))
            }
          >
            Today
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={instructorId} onValueChange={setInstructorId}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All instructors</SelectItem>
              {instructors.map((instructor) => {
                const name =
                  [instructor.firstName, instructor.lastName]
                    .filter(Boolean)
                    .join(" ") || "Unnamed";
                return (
                  <SelectItem key={instructor.id} value={instructor.id}>
                    {name}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <Select value={sessionType} onValueChange={setSessionType}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="GROUP">Group</SelectItem>
              <SelectItem value="PRIVATE">Private</SelectItem>
              <SelectItem value="DUET">Duet</SelectItem>
              <SelectItem value="TRIO">Trio</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-7">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayClasses = classesByDay.get(key) ?? [];
          const isToday = isSameDay(day, new Date());
          return (
            <div key={key} className="space-y-2">
              <div
                className={`text-xs font-medium uppercase tracking-wide ${
                  isToday ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {format(day, "EEE d MMM")}
                {isToday ? " · today" : ""}
              </div>

              {query.isLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : dayClasses.length === 0 ? (
                <p className="rounded-md border border-dashed bg-muted/30 p-3 text-center text-xs text-muted-foreground">
                  No classes
                </p>
              ) : (
                dayClasses.map((session) => {
                  const seatsLeft = Math.max(
                    session.capacity - session.booked,
                    0,
                  );
                  const isFull = seatsLeft === 0;
                  const requiresStaffBooking =
                    session.sessionType !== "GROUP";
                  const instructorName =
                    [
                      session.instructor.firstName,
                      session.instructor.lastName,
                    ]
                      .filter(Boolean)
                      .join(" ") || "Instructor";
                  return (
                    <Card key={session.id}>
                      <CardHeader className="space-y-1 p-3 pb-1">
                        <div className="flex items-center justify-between gap-2">
                          <CardTitle className="text-sm">
                            {session.title}
                          </CardTitle>
                          <Badge variant="secondary">
                            {session.sessionType}
                          </Badge>
                        </div>
                        <CardDescription>
                          {formatDateTime(session.startTime, studioTimezone)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-1 p-3 pt-1 text-xs">
                        <p className="text-muted-foreground">
                          {instructorName}
                        </p>
                        <p
                          className={
                            isFull
                              ? "font-medium text-destructive"
                              : "text-muted-foreground"
                          }
                        >
                          {isFull
                            ? "Sold out"
                            : `${seatsLeft} of ${session.capacity} seats`}
                        </p>
                        <div className="pt-1">
                          {requiresStaffBooking ? (
                            <Badge variant="outline">
                              Booked via studio
                            </Badge>
                          ) : (
                            <BookButton
                              classId={session.id}
                              isFull={isFull}
                            />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
