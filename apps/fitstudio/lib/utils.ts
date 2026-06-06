import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind utility classes, dropping conflicting ones. Equivalent to
 * the helper shipped by `npx shadcn-ui add`, but defined here so we do not
 * depend on the generator at runtime.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Convert a free-form string into a URL-safe slug. Used when a studio owner
 * creates a new tenant from the dashboard.
 */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

/**
 * Format an ISO date as a human-readable label in the studio's timezone.
 */
export function formatDateTime(
  value: Date | string,
  timeZone: string,
): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/**
 * Build 1-2 letter initials from optional first/last name fields, falling
 * back to a literal "?" so an `AvatarFallback` always has something to
 * render.
 */
export function initials(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
): string {
  const first = firstName?.trim()[0] ?? "";
  const last = lastName?.trim()[0] ?? "";
  const combined = `${first}${last}`.toUpperCase();
  return combined || "?";
}
