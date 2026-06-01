import type { RecurringRuleInput, Weekday } from "./zod";

const WEEKDAY_INDEX: Record<Weekday, number> = {
  SU: 0,
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
};

/**
 * Maximum number of occurrences we will ever expand from a single
 * recurring rule. Acts as a runaway safety net in case the caller
 * configures a far-future end date.
 */
const MAX_OCCURRENCES = 200;

export interface ClassOccurrence {
  startTime: Date;
  endTime: Date;
}

/**
 * Expand a {@link RecurringRuleInput} into the list of concrete
 * `(startTime, endTime)` pairs that should be persisted as individual
 * `Class` rows. The first occurrence is always `(seedStart, seedEnd)`.
 *
 * Pure function: no side effects. Easy to unit-test by passing fixed
 * dates.
 */
export function expandRecurringRule(
  seedStart: Date,
  seedEnd: Date,
  rule: RecurringRuleInput,
): ClassOccurrence[] {
  const durationMs = seedEnd.getTime() - seedStart.getTime();
  if (durationMs <= 0) {
    throw new Error("seedEnd must be after seedStart");
  }
  const endBoundary = new Date(rule.endDate);

  const occurrences: ClassOccurrence[] = [];
  const seenStarts = new Set<number>();

  const push = (start: Date): void => {
    if (start > endBoundary) return;
    const key = start.getTime();
    if (seenStarts.has(key)) return;
    seenStarts.add(key);
    occurrences.push({
      startTime: new Date(start),
      endTime: new Date(start.getTime() + durationMs),
    });
  };

  if (rule.frequency === "DAILY") {
    const cursor = new Date(seedStart);
    while (
      cursor <= endBoundary &&
      occurrences.length < MAX_OCCURRENCES
    ) {
      push(cursor);
      cursor.setDate(cursor.getDate() + 1);
    }
    return occurrences;
  }

  if (rule.frequency === "WEEKLY") {
    const weekdays =
      rule.weekdays && rule.weekdays.length > 0
        ? rule.weekdays
        : ([dayCodeForJsIndex(seedStart.getDay())] as Weekday[]);
    const weekdayNumbers = weekdays
      .map((code) => WEEKDAY_INDEX[code])
      .sort((a, b) => a - b);

    const weekCursor = new Date(seedStart);
    while (
      weekCursor <= endBoundary &&
      occurrences.length < MAX_OCCURRENCES
    ) {
      for (const targetDow of weekdayNumbers) {
        const candidate = new Date(weekCursor);
        const offset = (targetDow - weekCursor.getDay() + 7) % 7;
        candidate.setDate(candidate.getDate() + offset);
        if (candidate <= endBoundary && candidate >= seedStart) {
          push(candidate);
        }
      }
      weekCursor.setDate(weekCursor.getDate() + 7);
    }
    return occurrences.sort(
      (a, b) => a.startTime.getTime() - b.startTime.getTime(),
    );
  }

  // MONTHLY: repeat on the same day-of-month as the seed.
  const monthCursor = new Date(seedStart);
  while (
    monthCursor <= endBoundary &&
    occurrences.length < MAX_OCCURRENCES
  ) {
    push(monthCursor);
    monthCursor.setMonth(monthCursor.getMonth() + 1);
  }
  return occurrences;
}

/**
 * Serialise a {@link RecurringRuleInput} into a compact string for
 * storage on `Class.recurringRule`. The encoding is informational only;
 * we never round-trip it back into expansion.
 */
export function encodeRecurringRule(rule: RecurringRuleInput): string {
  const parts = [`FREQ=${rule.frequency}`];
  if (rule.frequency === "WEEKLY" && rule.weekdays?.length) {
    parts.push(`BYDAY=${rule.weekdays.join(",")}`);
  }
  parts.push(`UNTIL=${rule.endDate}`);
  return parts.join(";");
}

function dayCodeForJsIndex(index: number): Weekday {
  const lookup: Weekday[] = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
  return lookup[index] ?? "MO";
}
