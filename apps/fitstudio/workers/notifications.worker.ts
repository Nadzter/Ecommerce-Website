import { Worker } from "bullmq";

import {
  NOTIFICATIONS_QUEUE_NAME,
  getRedisConnection,
} from "@/lib/notifications/queue";
import { sendNotification } from "@/lib/notifications";
import type { NotificationJobPayload } from "@/lib/notifications/types";

/**
 * Long-running notifications worker. Run with `pnpm start:worker`.
 *
 *   Concurrency is intentionally modest (5) — WhatsApp throughput is
 *   the bottleneck and Twilio rate-limits per number.
 */
const worker = new Worker<NotificationJobPayload>(
  NOTIFICATIONS_QUEUE_NAME,
  async (job) => {
    const result = await sendNotification(job.data);
    if (!result.delivered) {
      // Throwing causes BullMQ to mark the job failed and retry per
      // `defaultJobOptions.attempts`. We rely on `result.reason` for
      // observability rather than re-encoding the failure cause here.
      throw new Error(`Notification not delivered: ${result.reason ?? "unknown"}`);
    }
    return result;
  },
  {
    connection: getRedisConnection(),
    concurrency: 5,
  },
);

worker.on("completed", (job, result) => {
  console.info("[worker] completed", {
    jobId: job.id,
    type: job.name,
    channel: (result as { channel?: string } | undefined)?.channel,
  });
});

worker.on("failed", (job, error) => {
  console.error("[worker] failed", {
    jobId: job?.id,
    type: job?.name,
    error: error instanceof Error ? error.message : String(error),
  });
});

worker.on("error", (error) => {
  console.error("[worker] internal error", error);
});

const shutdown = async (signal: string): Promise<void> => {
  console.info(`[worker] received ${signal}, draining`);
  await worker.close();
  process.exit(0);
};

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

console.info("[worker] notifications worker started");
