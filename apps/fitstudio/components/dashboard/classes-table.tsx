"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { addDays } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchJson } from "@/lib/api-client";
import { formatDateTime } from "@/lib/utils";
import {
  ClassesFilters,
  type ClassesFiltersValue,
  type InstructorOption,
} from "./classes-filters";

interface ApiClass {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  capacity: number;
  booked: number;
  instructor: { id: string; firstName: string | null; lastName: string | null };
  location: "INPERSON" | "ONLINE" | "HYBRID";
  sessionType: "GROUP" | "PRIVATE" | "DUET" | "TRIO";
  equipment: string[];
  isRecurring: boolean;
  cancelledAt: string | null;
}

interface ClassesTableProps {
  studioTimezone: string;
  instructors: readonly InstructorOption[];
}

export function ClassesTable({
  studioTimezone,
  instructors,
}: ClassesTableProps): JSX.Element {
  const [filters, setFilters] = React.useState<ClassesFiltersValue>(() => ({
    from: new Date(),
    to: addDays(new Date(), 30),
    instructorId: "all",
    sessionType: "all",
  }));

  const queryString = React.useMemo(() => {
    const params = new URLSearchParams({
      from: filters.from.toISOString(),
      to: filters.to.toISOString(),
    });
    if (filters.instructorId !== "all") {
      params.set("instructorId", filters.instructorId);
    }
    if (filters.sessionType !== "all") {
      params.set("sessionType", filters.sessionType);
    }
    return params.toString();
  }, [filters]);

  const query = useQuery({
    queryKey: ["dashboard-classes", queryString],
    queryFn: () =>
      fetchJson<{ classes: ApiClass[] }>(`/api/classes?${queryString}`),
  });

  return (
    <div className="space-y-4">
      <ClassesFilters
        value={filters}
        onChange={setFilters}
        instructors={instructors}
      />

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Class</TableHead>
              <TableHead>Instructor</TableHead>
              <TableHead>Start</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead className="text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : query.isError ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-6 text-center text-sm text-destructive"
                >
                  Failed to load classes:{" "}
                  {query.error instanceof Error
                    ? query.error.message
                    : "Unknown error"}
                </TableCell>
              </TableRow>
            ) : query.data && query.data.classes.length > 0 ? (
              query.data.classes.map((row) => {
                const instructorName =
                  [row.instructor.firstName, row.instructor.lastName]
                    .filter(Boolean)
                    .join(" ") || "Unnamed";
                const isFull = row.booked >= row.capacity;
                return (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/dashboard/classes/${row.id}`}
                        className="hover:underline"
                      >
                        {row.title}
                      </Link>
                      {row.isRecurring ? (
                        <Badge variant="outline" className="ml-2">
                          Recurring
                        </Badge>
                      ) : null}
                    </TableCell>
                    <TableCell>{instructorName}</TableCell>
                    <TableCell>
                      {formatDateTime(row.startTime, studioTimezone)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{row.sessionType}</Badge>
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          isFull ? "font-medium text-destructive" : ""
                        }
                      >
                        {row.booked} / {row.capacity}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/classes/${row.id}`}>
                          Manage
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-6 text-center text-sm text-muted-foreground"
                >
                  No classes match the current filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
