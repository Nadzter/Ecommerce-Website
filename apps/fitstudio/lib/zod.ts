import { z } from "zod";

export const sessionTypeSchema = z.enum(["GROUP", "PRIVATE", "DUET", "TRIO"]);
export const classLocationSchema = z.enum(["INPERSON", "ONLINE", "HYBRID"]);

export const recurringFrequencySchema = z.enum(["DAILY", "WEEKLY", "MONTHLY"]);

export const weekdaySchema = z.enum([
  "MO",
  "TU",
  "WE",
  "TH",
  "FR",
  "SA",
  "SU",
]);

export type Weekday = z.infer<typeof weekdaySchema>;

/**
 * Recurrence definition consumed by `lib/recurring.ts`. Only weekly
 * recurrence honours `weekdays`; daily/monthly ignore the list.
 */
export const recurringRuleSchema = z.object({
  frequency: recurringFrequencySchema,
  weekdays: z.array(weekdaySchema).optional(),
  endDate: z.string().datetime(),
});

export type RecurringRuleInput = z.infer<typeof recurringRuleSchema>;

/**
 * Body accepted by `POST /api/classes`. Times are ISO 8601; the API
 * converts them to UTC before persisting.
 */
export const createClassSchema = z
  .object({
    title: z.string().min(1).max(120),
    description: z.string().max(5000).optional().nullable(),
    instructorId: z.string().min(1),
    startTime: z.string().datetime(),
    endTime: z.string().datetime(),
    capacity: z.number().int().min(1).max(500),
    location: classLocationSchema,
    sessionType: sessionTypeSchema.default("GROUP"),
    zoomLink: z.string().url().optional().nullable(),
    equipment: z.array(z.string().min(1)).default([]),
    recurring: recurringRuleSchema.optional(),
  })
  .refine((value) => new Date(value.endTime) > new Date(value.startTime), {
    message: "endTime must be after startTime",
    path: ["endTime"],
  })
  .refine(
    (value) =>
      value.location === "INPERSON" || Boolean(value.zoomLink?.length),
    {
      message: "zoomLink is required for online or hybrid classes",
      path: ["zoomLink"],
    },
  );

export type CreateClassInput = z.infer<typeof createClassSchema>;

/**
 * Filters accepted by `GET /api/classes`.
 */
export const listClassesQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  instructorId: z.string().optional(),
  sessionType: sessionTypeSchema.optional(),
  location: classLocationSchema.optional(),
  includeCancelled: z.coerce.boolean().optional(),
});

export type ListClassesQuery = z.infer<typeof listClassesQuerySchema>;

/**
 * Body accepted by `POST /api/bookings`. For private sessions an owner
 * may book on behalf of a specific member by passing `userId`.
 */
export const createBookingSchema = z.object({
  classId: z.string().min(1),
  userId: z.string().optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
