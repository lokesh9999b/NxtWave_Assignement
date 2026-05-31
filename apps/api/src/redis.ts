import { Redis } from "ioredis";
import { config } from "./config.js";

export const redis = new Redis(config.REDIS_URL, {
  maxRetriesPerRequest: 2,
  enableReadyCheck: false,
  retryStrategy(times) {
    return Math.min(times * 200, 2000);
  }
});

redis.on("error", (error) => {
  console.error(`Redis connection error: ${error.message}`);
});

export async function clearTaskListCache(organizationId: string) {
  const pattern = `tasks:${organizationId}:*`;
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(keys);
  }
}
