import { Calendar, Clock, MapPin, User } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export interface ClassCardProps {
  title: string;
  description: string | null;
  instructorName: string;
  startTime: Date;
  endTime: Date;
  location: "INPERSON" | "ONLINE" | "HYBRID";
  seatsLeft: number;
  capacity: number;
  timezone: string;
}

const locationLabels: Record<ClassCardProps["location"], string> = {
  INPERSON: "In-person",
  ONLINE: "Online",
  HYBRID: "Hybrid",
};

export function ClassCard(props: ClassCardProps): JSX.Element {
  const soldOut = props.seatsLeft === 0;
  const lowStock = !soldOut && props.seatsLeft <= 2;
  const dayFormatter = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: props.timezone,
  });
  const timeFormatter = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: props.timezone,
  });
  const day = dayFormatter.format(props.startTime);
  const startTime = timeFormatter.format(props.startTime);
  const endTime = timeFormatter.format(props.endTime);
  const fillPercent = Math.round(
    ((props.capacity - props.seatsLeft) / props.capacity) * 100,
  );

  return (
    <Card className="group relative overflow-hidden border-border/60 transition-all duration-300 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-lg">
      <div
        className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-foreground/0 via-foreground/40 to-foreground/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden
      />
      <CardContent className="space-y-5 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {day}
            </p>
            <h3 className="text-lg font-semibold tracking-tight">
              {props.title}
            </h3>
          </div>
          <Badge
            variant="outline"
            className="shrink-0 gap-1 font-medium text-muted-foreground"
          >
            <MapPin className="h-3 w-3" aria-hidden />
            {locationLabels[props.location]}
          </Badge>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="tabular-nums">
              {startTime} – {endTime}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="truncate">{props.instructorName}</span>
          </div>
        </div>

        {props.description ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {props.description}
          </p>
        ) : null}

        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs">
            {soldOut ? (
              <span className="font-medium text-destructive">Sold out</span>
            ) : (
              <span className={lowStock ? "font-medium text-amber-600" : "text-muted-foreground"}>
                {props.seatsLeft} of {props.capacity} spots
                {lowStock ? " — almost full" : ""}
              </span>
            )}
            <span className="tabular-nums text-muted-foreground">
              {fillPercent}%
            </span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all ${
                soldOut
                  ? "bg-destructive"
                  : lowStock
                    ? "bg-amber-500"
                    : "bg-foreground/70"
              }`}
              style={{ width: `${Math.max(fillPercent, 4)}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
