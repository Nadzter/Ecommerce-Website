import { ApiErrors, ok, withApi } from "@/lib/api";
import { requireOwner } from "@/lib/auth";
import { enqueueNotification } from "@/lib/notifications";
import { getCurrentStudio } from "@/lib/tenant";

export const runtime = "nodejs";

/**
 * Enqueue a sample `booking_confirmed` to the studio owner so they can
 * sanity-check the WhatsApp pipeline. We do not bypass the queue —
 * everything must flow through the worker so we are also confirming the
 * worker is alive.
 */
export async function POST(): Promise<Response> {
  return withApi(async () => {
    const ctx = await requireOwner();
    const studio = await getCurrentStudio();

    if (!ctx.user.phone) {
      throw ApiErrors.badRequest(
        "Add a phone number to your profile before sending a test message",
      );
    }

    const memberName =
      [ctx.user.firstName, ctx.user.lastName].filter(Boolean).join(" ") ||
      ctx.user.email;

    const jobId = await enqueueNotification({
      type: "booking_confirmed",
      userId: ctx.user.id,
      studioId: studio.id,
      data: {
        memberName,
        className: "Test class",
        instructorName: "FitStudio bot",
        date: "today",
        time: "12:00",
      },
    });

    return ok({ enqueued: true, jobId });
  });
}
