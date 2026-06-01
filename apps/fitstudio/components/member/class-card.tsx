import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";

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

export function ClassCard(props: ClassCardProps): JSX.Element {
  const soldOut = props.seatsLeft === 0;
  return (
    <Card>
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">{props.title}</CardTitle>
          <Badge variant="secondary">{props.location}</Badge>
        </div>
        <CardDescription>
          {formatDateTime(props.startTime, props.timezone)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p>
          <span className="text-muted-foreground">With</span>{" "}
          {props.instructorName}
        </p>
        <p>
          {soldOut ? (
            <Badge variant="destructive">Sold out</Badge>
          ) : (
            <span className="text-muted-foreground">
              {props.seatsLeft} of {props.capacity} seats left
            </span>
          )}
        </p>
        {props.description ? (
          <p className="text-muted-foreground">{props.description}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
