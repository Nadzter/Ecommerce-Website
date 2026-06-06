"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchJson } from "@/lib/api-client";
import type { CreateClassInput } from "@/lib/zod";
import type { Weekday } from "@/lib/zod";

const MarkdownEditor = dynamic(
  () => import("@uiw/react-md-editor").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => <Skeleton className="h-32 w-full" />,
  },
);

interface InstructorOption {
  id: string;
  firstName: string | null;
  lastName: string | null;
}

interface ClassFormDialogProps {
  instructors: readonly InstructorOption[];
}

interface FormState {
  title: string;
  description: string;
  instructorId: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: string;
  location: "INPERSON" | "ONLINE" | "HYBRID";
  sessionType: "GROUP" | "PRIVATE" | "DUET" | "TRIO";
  zoomLink: string;
  equipment: string[];
  newEquipment: string;
  recurring: boolean;
  frequency: "DAILY" | "WEEKLY" | "MONTHLY";
  weekdays: Weekday[];
  recurringEnd: string;
}

const DEFAULT_FORM: FormState = {
  title: "",
  description: "",
  instructorId: "",
  date: "",
  startTime: "09:00",
  endTime: "10:00",
  capacity: "10",
  location: "INPERSON",
  sessionType: "GROUP",
  zoomLink: "",
  equipment: [],
  newEquipment: "",
  recurring: false,
  frequency: "WEEKLY",
  weekdays: [],
  recurringEnd: "",
};

const WEEKDAY_OPTIONS: Array<{ value: Weekday; label: string }> = [
  { value: "MO", label: "Mon" },
  { value: "TU", label: "Tue" },
  { value: "WE", label: "Wed" },
  { value: "TH", label: "Thu" },
  { value: "FR", label: "Fri" },
  { value: "SA", label: "Sat" },
  { value: "SU", label: "Sun" },
];

function combineDateTime(date: string, time: string): string {
  return new Date(`${date}T${time}:00`).toISOString();
}

export function ClassFormDialog({
  instructors,
}: ClassFormDialogProps): JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<FormState>(DEFAULT_FORM);

  React.useEffect(() => {
    if (open && !form.instructorId && instructors[0]) {
      setForm((prev) => ({ ...prev, instructorId: instructors[0]!.id }));
    }
  }, [open, form.instructorId, instructors]);

  const mutation = useMutation({
    mutationFn: (input: CreateClassInput) =>
      fetchJson<{ created: number }>("/api/classes", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: (result) => {
      toast.success(
        result.created > 1
          ? `Created ${result.created} recurring sessions`
          : "Class created",
      );
      queryClient.invalidateQueries({ queryKey: ["dashboard-classes"] });
      router.refresh();
      setForm(DEFAULT_FORM);
      setOpen(false);
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Unable to create"),
  });

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleWeekday = (day: Weekday) => {
    setForm((prev) => ({
      ...prev,
      weekdays: prev.weekdays.includes(day)
        ? prev.weekdays.filter((entry) => entry !== day)
        : [...prev.weekdays, day],
    }));
  };

  const addEquipment = () => {
    const trimmed = form.newEquipment.trim();
    if (!trimmed) return;
    if (form.equipment.includes(trimmed)) {
      setForm((prev) => ({ ...prev, newEquipment: "" }));
      return;
    }
    setForm((prev) => ({
      ...prev,
      equipment: [...prev.equipment, trimmed],
      newEquipment: "",
    }));
  };

  const removeEquipment = (entry: string) => {
    setForm((prev) => ({
      ...prev,
      equipment: prev.equipment.filter((value) => value !== entry),
    }));
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.date) {
      toast.error("Pick a date");
      return;
    }
    if (!form.instructorId) {
      toast.error("Pick an instructor");
      return;
    }
    const payload: CreateClassInput = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      instructorId: form.instructorId,
      startTime: combineDateTime(form.date, form.startTime),
      endTime: combineDateTime(form.date, form.endTime),
      capacity: Number(form.capacity),
      location: form.location,
      sessionType: form.sessionType,
      zoomLink:
        form.location === "INPERSON" ? null : form.zoomLink.trim() || null,
      equipment: form.equipment,
      ...(form.recurring && form.recurringEnd
        ? {
            recurring: {
              frequency: form.frequency,
              endDate: new Date(`${form.recurringEnd}T23:59:59`).toISOString(),
              weekdays:
                form.frequency === "WEEKLY" && form.weekdays.length > 0
                  ? form.weekdays
                  : undefined,
            },
          }
        : {}),
    };
    mutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>New class</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create class</DialogTitle>
          <DialogDescription>
            Schedule a single session or a recurring series.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4" data-color-mode="light">
          <div className="space-y-2">
            <Label htmlFor="class-title">Title</Label>
            <Input
              id="class-title"
              value={form.title}
              onChange={(event) => update("title", event.target.value)}
              required
              minLength={1}
              maxLength={120}
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <MarkdownEditor
              value={form.description}
              onChange={(value) => update("description", value ?? "")}
              height={180}
              preview="edit"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Instructor</Label>
              <Select
                value={form.instructorId}
                onValueChange={(value) => update("instructorId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select instructor" />
                </SelectTrigger>
                <SelectContent>
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
            <div className="space-y-2">
              <Label>Session type</Label>
              <Select
                value={form.sessionType}
                onValueChange={(value) =>
                  update(
                    "sessionType",
                    value as FormState["sessionType"],
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GROUP">Group</SelectItem>
                  <SelectItem value="PRIVATE">Private (1:1)</SelectItem>
                  <SelectItem value="DUET">Duet (2)</SelectItem>
                  <SelectItem value="TRIO">Trio (3)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(event) => update("date", event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Start time</Label>
              <Input
                type="time"
                value={form.startTime}
                onChange={(event) => update("startTime", event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>End time</Label>
              <Input
                type="time"
                value={form.endTime}
                onChange={(event) => update("endTime", event.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Capacity</Label>
              <Input
                type="number"
                min={1}
                max={500}
                value={form.capacity}
                onChange={(event) => update("capacity", event.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                If equipment is listed below, capacity is capped at the
                number of items.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Select
                value={form.location}
                onValueChange={(value) =>
                  update("location", value as FormState["location"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INPERSON">In person</SelectItem>
                  <SelectItem value="ONLINE">Online</SelectItem>
                  <SelectItem value="HYBRID">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {form.location !== "INPERSON" ? (
            <div className="space-y-2">
              <Label htmlFor="zoom-link">Zoom link</Label>
              <Input
                id="zoom-link"
                type="url"
                placeholder="https://zoom.us/j/..."
                value={form.zoomLink}
                onChange={(event) => update("zoomLink", event.target.value)}
              />
            </div>
          ) : null}

          <div className="space-y-2">
            <Label>Equipment</Label>
            <div className="flex gap-2">
              <Input
                value={form.newEquipment}
                placeholder="e.g. Reformer 1"
                onChange={(event) => update("newEquipment", event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addEquipment();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addEquipment}>
                Add
              </Button>
            </div>
            {form.equipment.length > 0 ? (
              <ul className="flex flex-wrap gap-2 text-sm">
                {form.equipment.map((entry) => (
                  <li
                    key={entry}
                    className="flex items-center gap-1 rounded-md border bg-muted px-2 py-1"
                  >
                    <span>{entry}</span>
                    <button
                      type="button"
                      onClick={() => removeEquipment(entry)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={`Remove ${entry}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="space-y-3 rounded-md border p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="recurring-switch">Recurring</Label>
                <p className="text-xs text-muted-foreground">
                  Generate multiple sessions from a single rule.
                </p>
              </div>
              <Switch
                id="recurring-switch"
                checked={form.recurring}
                onCheckedChange={(checked) => update("recurring", checked)}
              />
            </div>

            {form.recurring ? (
              <div className="space-y-3">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Select
                      value={form.frequency}
                      onValueChange={(value) =>
                        update("frequency", value as FormState["frequency"])
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DAILY">Daily</SelectItem>
                        <SelectItem value="WEEKLY">Weekly</SelectItem>
                        <SelectItem value="MONTHLY">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Ends on</Label>
                    <Input
                      type="date"
                      value={form.recurringEnd}
                      onChange={(event) =>
                        update("recurringEnd", event.target.value)
                      }
                    />
                  </div>
                </div>
                {form.frequency === "WEEKLY" ? (
                  <div className="space-y-2">
                    <Label>Days of week</Label>
                    <div className="flex flex-wrap gap-2">
                      {WEEKDAY_OPTIONS.map((option) => (
                        <label
                          key={option.value}
                          className="flex items-center gap-2 text-sm"
                        >
                          <Checkbox
                            checked={form.weekdays.includes(option.value)}
                            onCheckedChange={() => toggleWeekday(option.value)}
                          />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setForm(DEFAULT_FORM);
                setOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
