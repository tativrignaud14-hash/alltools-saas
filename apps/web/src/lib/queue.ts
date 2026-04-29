import { Queue } from "bullmq";
import IORedis from "ioredis";

let queue: Queue | null = null;

function getRedisUrl() {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    throw new Error("REDIS_URL is not configured");
  }
  return redisUrl;
}

function isTlsRedis(redisUrl: string) {
  return redisUrl.startsWith("rediss://") || redisUrl.includes("upstash.io");
}

export async function resetQueue() {
  if (!queue) return;

  const current = queue;
  queue = null;
  await current.close().catch(() => undefined);
}

export function getQueue() {
  if (!queue) {
    const redisUrl = getRedisUrl();
    const connection = new IORedis(getRedisUrl(), {
      tls: isTlsRedis(redisUrl) ? {} : undefined,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
      connectTimeout: 10000,
    });

    queue = new Queue("alltools", { connection });
  }

  return queue;
}
