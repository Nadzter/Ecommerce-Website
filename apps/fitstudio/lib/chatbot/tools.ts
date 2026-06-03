import type Anthropic from "@anthropic-ai/sdk";

/**
 * Tool definitions the chatbot exposes. Each tool's description is
 * prescriptive about *when* to call it — this matters on Opus 4.8,
 * which is more conservative about reaching for tools than prior
 * models unless triggering conditions are explicit.
 *
 * Implementations live in `lib/chatbot/toolHandlers.ts`.
 */
export const chatbotTools: Anthropic.Messages.Tool[] = [
  {
    name: "list_upcoming_classes",
    description:
      "Get upcoming classes at the studio. Call this whenever the member asks about the schedule, what classes are available, or before booking a class you don't already have the classId for. Returns classId, title, instructorName, startTime, endTime, spotsLeft, sessionType, location.",
    input_schema: {
      type: "object",
      properties: {
        date_from: {
          type: "string",
          description: "ISO 8601 lower bound on startTime (inclusive)",
        },
        date_to: {
          type: "string",
          description: "ISO 8601 upper bound on startTime (inclusive)",
        },
        instructor: {
          type: "string",
          description:
            "Filter to classes taught by this instructor name (case-insensitive substring match).",
        },
        session_type: {
          type: "string",
          enum: ["GROUP", "PRIVATE", "DUET", "TRIO"],
          description: "Restrict to a specific session type.",
        },
        spots_available_only: {
          type: "boolean",
          description: "If true, hide sold-out classes.",
        },
      },
    },
  },
  {
    name: "get_my_bookings",
    description:
      "Get the member's bookings. Call this whenever the member asks about their reservations or you need a bookingId before cancelling. Returns bookingId, className, instructorName, startTime, status, checkedIn.",
    input_schema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["upcoming", "past", "all"],
          description: "Defaults to upcoming.",
        },
      },
    },
  },
  {
    name: "book_class",
    description:
      "Book a specific class for the member. Always confirm the exact class with the member before calling this. Returns success flag, bookingId (when confirmed), status (CONFIRMED or WAITLISTED), and a human-readable message you can echo to the member.",
    input_schema: {
      type: "object",
      properties: {
        classId: {
          type: "string",
          description: "The classId returned from list_upcoming_classes.",
        },
      },
      required: ["classId"],
    },
  },
  {
    name: "cancel_booking",
    description:
      "Cancel one of the member's bookings. Always confirm with the member before calling this. Cancellations more than 2 hours before class start are refunded; later cancellations are not. Returns success flag, creditsRefunded, and a human-readable message.",
    input_schema: {
      type: "object",
      properties: {
        bookingId: {
          type: "string",
          description: "The bookingId returned from get_my_bookings.",
        },
      },
      required: ["bookingId"],
    },
  },
  {
    name: "get_my_credits",
    description:
      "Get the member's current credit balance and active membership. Call whenever the member asks about credits, balance, expiry, or membership type.",
    input_schema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_studio_info",
    description:
      "Get information about the studio: location, schedule overview, pricing, instructors, or a general summary. Call whenever the member asks something about the studio you don't already know.",
    input_schema: {
      type: "object",
      properties: {
        topic: {
          type: "string",
          enum: ["location", "schedule", "pricing", "instructors", "general"],
          description: "Defaults to general.",
        },
      },
    },
  },
];
