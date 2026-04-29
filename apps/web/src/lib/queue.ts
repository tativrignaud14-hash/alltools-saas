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

export function getQueue() {
  if (!queue) {
    const connection = new IORedis(getRedisUrl(), {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
    });

    queue = new Queue("alltools", { connection });
  }

  return queue;
}
