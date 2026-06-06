import { Queue, type JobsOptions } from "bullmq";
import IORedis, { type Redis } from "ioredis";

import type { NotificationJobPayload } from "./types";

export const NOTIFICATIONS_QUEUE_NAME = "notifications";

let connectionSingleton: Redis | null = null;
let queueSingleton: Queue<NotificationJobPayload> | null = null;

/**
 * Lazily create the ioredis connection. We use rediss:// (TLS) by default
 * and require `maxRetriesPerRequest: null` so BullMQ owns the retry
 * behaviour.
 */
export function getRedisConnection(): Redis {
  if (connectionSingleton) return connectionSingleton;
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error("REDIS_URL is not configured");
  }
  connectionSingleton = new IORedis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
  return connectionSingleton;
}

/**
 * Singleton BullMQ queue used by every notification producer. We expose
 * `notificationsQueue` only via this accessor so tests can swap the
 * connection by injecting an env var.
 */
export function getNotificationsQueue(): Queue<NotificationJobPayload> {
  if (queueSingleton) return queueSingleton;
  queueSingleton = new Queue<NotificationJobPayload>(NOTIFICATIONS_QUEUE_NAME, {
    connection: getRedisConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 5_000 },
      removeOnComplete: { age: 24 * 3_600, count: 1_000 },
      removeOnFail: { age: 14 * 24 * 3_600 },
    },
  });
  return queueSingleton;
}

/**
 * Enqueue a notification. Returns the BullMQ job id (which we persist on
 * `Booking.reminderJobId` for scheduled reminders so cancellations can
 * remove them).
 *
 * `delayMs` schedules the job for the future. We clamp to 0 so a
 * misconfigured caller never gets BullMQ's negative-delay error.
 */
export async function enqueueNotification(
  payload: NotificationJobPayload,
  delayMs?: number,
): Promise<string> {
  const queue = getNotificationsQueue();
  const options: JobsOptions = {};
  if (typeof delayMs === "number" && delayMs > 0) {
    options.delay = delayMs;
  }
  const job = await queue.add(payload.type, payload, options);
  return String(job.id);
}

/**
 * Remove a previously enqueued job. Safe to call when the id is `null`
 * or the job has already executed.
 */
export async function removeNotificationJob(
  jobId: string | null | undefined,
): Promise<void> {
  if (!jobId) return;
  try {
    const queue = getNotificationsQueue();
    await queue.remove(jobId);
  } catch (error) {
    // BullMQ throws when the job has already completed and been pruned.
    // That is the desired outcome for a cancellation path, so swallow.
    console.warn("[notifications.queue] remove failed", { jobId, error });
  }
}
