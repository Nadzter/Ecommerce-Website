/**
 * Pure, framework-free rules that are safe to import from both server and
 * client code. The server-only counterparts (Prisma access) live in
 * `lib/booking.ts`.
 */

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

/**
 * Whether the time between `now` and a class start is large enough to
 * allow self-service cancellation by the member.
 */
export function canMemberCancel(
  classStart: Date | string,
  now: Date = new Date(),
): boolean {
  const start =
    typeof classStart === "string" ? new Date(classStart) : classStart;
  return start.getTime() - now.getTime() > TWO_HOURS_MS;
}
