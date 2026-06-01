"use client";

import * as React from "react";
import { useParams, notFound } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ClassBookingsList } from "@/components/dashboard/class-bookings-list";
import { CancelClassButton } from "@/components/dashboard/cancel-class-button";
import { fetchJson } from "@/lib/api-client";

interface ClassDetailResponse {
  class: {
    id: string;
    title: string;
    description: string | null;
    startTime: string;
    endTime: string;
    capacity: number;
    location: "INPERSON" | "ONLINE" | "HYBRID";
    sessionType: "GROUP" | "PRIVATE" | "DUET" | "TRIO";
    equipment: string[];
    zoomLink: string | null;
    isRecurring: boolean;
    recurringRule: string | null;
    cancelledAt: string | null;
    instructor: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      email: string;
    };
    bookings: Array<{
      id: string;
      status: "CONFIRMED" | "WAITLISTED" | "CANCELLED";
      checkedInAt: string | null;
      createdAt: string;
      user: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        email: string;
      };
    }>;
  };
}

export default function ClassDetailPage(): JSX.Element {
  const params = useParams<{ classId: string }>();
  const classId = params?.classId;

  const query = useQuery({
    queryKey: ["class-detail", classId],
    enabled: Boolean(classId),
    queryFn: () =>
      fetchJson<ClassDetailResponse>(`/api/classes/${classId}`),
  });

  if (!classId) notFound();

  if (query.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Class not found</CardTitle>
          <CardDescription>
            {query.error instanceof Error
              ? query.error.message
              : "We could not load this class."}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const session = query.data.class;
  const confirmed = session.bookings.filter((b) => b.status === "CONFIRMED");
  const waitlisted = session.bookings.filter(
    (b) => b.status === "WAITLISTED",
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {session.title}
            </h1>
            <Badge variant="secondary">{session.sessionType}</Badge>
            {session.cancelledAt ? (
              <Badge variant="destructive">Cancelled</Badge>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">
            {new Date(session.startTime).toLocaleString()} —{" "}
            {new Date(session.endTime).toLocaleString()}
          </p>
        </div>
        {!session.cancelledAt ? (
          <CancelClassButton classId={session.id} />
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Instructor</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="font-medium">
              {[session.instructor.firstName, session.instructor.lastName]
                .filter(Boolean)
                .join(" ") || "Unnamed"}
            </p>
            <p className="text-muted-foreground">
              {session.instructor.email}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Capacity</CardTitle>
            <CardDescription>
              {confirmed.length} confirmed · {waitlisted.length} waitlisted ·{" "}
              {Math.max(session.capacity - confirmed.length, 0)} seats left
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <p>
              <span className="text-muted-foreground">Total seats:</span>{" "}
              {session.capacity}
            </p>
            {session.equipment.length > 0 ? (
              <p className="text-muted-foreground">
                Equipment: {session.equipment.join(", ")}
              </p>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Logistics</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>
              <span className="text-muted-foreground">Location:</span>{" "}
              {session.location}
            </p>
            {session.zoomLink ? (
              <a
                href={session.zoomLink}
                target="_blank"
                rel="noreferrer"
                className="break-all text-primary hover:underline"
              >
                {session.zoomLink}
              </a>
            ) : null}
            {session.isRecurring ? (
              <p className="text-muted-foreground">
                Recurring: {session.recurringRule}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Bookings</h2>
        <ClassBookingsList
          classId={session.id}
          bookings={session.bookings}
        />
      </section>
    </div>
  );
}
