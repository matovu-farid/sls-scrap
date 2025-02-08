import { Redis } from "@upstash/redis";
import { z } from "zod";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export const setCache = async <T>(key: string, value: T) => {
  await redis.set(key, JSON.stringify(value));
};

export const getCache = async <T>(key: string, schema: z.ZodSchema<T>) => {
  const data = await redis.get(key);

  return schema.parse(data);
};

export async function delCache(key: string) {
  await redis.del(key);
}
