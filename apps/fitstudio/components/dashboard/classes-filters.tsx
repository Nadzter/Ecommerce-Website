"use client";

import * as React from "react";
import { addDays, format } from "date-fns";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface ClassesFiltersValue {
  from: Date;
  to: Date;
  instructorId: string | "all";
  sessionType: "all" | "GROUP" | "PRIVATE" | "DUET" | "TRIO";
}

export interface InstructorOption {
  id: string;
  firstName: string | null;
  lastName: string | null;
}

interface ClassesFiltersProps {
  value: ClassesFiltersValue;
  onChange: (next: ClassesFiltersValue) => void;
  instructors: readonly InstructorOption[];
}

export function ClassesFilters({
  value,
  onChange,
  instructors,
}: ClassesFiltersProps): JSX.Element {
  const toLocalDateInput = (date: Date): string =>
    format(date, "yyyy-MM-dd");

  const setFrom = (next: string): void => {
    onChange({ ...value, from: new Date(`${next}T00:00:00`) });
  };
  const setTo = (next: string): void => {
    onChange({ ...value, to: new Date(`${next}T23:59:59`) });
  };
  const setInstructor = (next: string): void => {
    onChange({ ...value, instructorId: next });
  };
  const setSessionType = (next: string): void => {
    onChange({
      ...value,
      sessionType: next as ClassesFiltersValue["sessionType"],
    });
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted-foreground">From</span>
        <Input
          type="date"
          value={toLocalDateInput(value.from)}
          onChange={(event) => setFrom(event.target.value)}
          className="w-40"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted-foreground">To</span>
        <Input
          type="date"
          value={toLocalDateInput(value.to)}
          onChange={(event) => setTo(event.target.value)}
          className="w-40"
        />
      </label>
      <div className="flex flex-col gap-1 text-sm">
        <span className="text-muted-foreground">Instructor</span>
        <Select value={value.instructorId} onValueChange={setInstructor}>
          <SelectTrigger className="w-48">
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
      </div>
      <div className="flex flex-col gap-1 text-sm">
        <span className="text-muted-foreground">Type</span>
        <Select value={value.sessionType} onValueChange={setSessionType}>
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
      <Button
        variant="ghost"
        size="sm"
        onClick={() =>
          onChange({
            from: new Date(),
            to: addDays(new Date(), 30),
            instructorId: "all",
            sessionType: "all",
          })
        }
      >
        Reset
      </Button>
    </div>
  );
}
