import Redis from "ioredis";

const globalForRedis = globalThis as unknown as { redis: Redis | undefined };

function getRedis(): Redis | null {
  if (globalForRedis.redis) return globalForRedis.redis;

  const url = process.env.REDIS_URL;
  if (!url) return null;

  const redis = new Redis(url, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      if (times > 3) return null;
      return Math.min(times * 200, 2000);
    },
    lazyConnect: true,
  });

  globalForRedis.redis = redis;
  return redis;
}

export const redis = getRedis();

export async function getDailyKey(prefix: string, date?: Date): Promise<string> {
  const d = date ?? new Date();
  const dateStr = d.toISOString().slice(0, 10);
  return `daily:${dateStr}:${prefix}`;
}
