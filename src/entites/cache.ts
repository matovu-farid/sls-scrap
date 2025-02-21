import { Redis } from "@upstash/redis";
import { z } from "zod";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

type JSONPaths<T> = {
  [K in keyof T]: T[K] extends Array<any>
    ? `$.${K & string}` | `$.${K & string}[${number}]`
    : `$.${K & string}`;
}[keyof T];

type PickNumberKeys<T> = {
  [K in keyof T]: T[K] extends number ? K : never;
}[keyof T];

const test = {
  a: 1,
  b: "cool",
  c: 3,
  d: [1],
};
type KeysWithNumbers<T> = Pick<T, PickNumberKeys<T>>;

export type NumberKeysType<T> = JSONPaths<KeysWithNumbers<T>>;

export type Pathtype<T> = (string & Exclude<JSONPaths<T>, undefined>) | "$";

type ValueType<T, P extends Pathtype<T>> = P extends "$"
  ? T
  : P extends `$.${infer R extends keyof T & string}[${number}]`
  ? T[R] extends Array<infer U>
    ? U
    : never
  : P extends `$.${infer R extends keyof T & string}`
  ? T[R]
  : never;

function setCacheFor<T>(key: string) {
  return function <P extends Pathtype<T>>(
    path: P,
    value: NonNullable<ValueType<T, P>>
  ) {
    return redis.json.set(key, path, value);
  };
}

const appendCacheFor =
  <T>(key: string) =>
  <P extends Pathtype<T>>(
    path: P,
    value: NonNullable<ValueType<T, P>> extends Array<infer U> ? U : never
  ) =>
    redis.json.arrappend(key, path, value);

export const getCache = async <T>(key: string, schema: z.ZodSchema<T>) => {
  const data = await redis.hgetall(key);

  const result = schema.safeParse(data);
  if (!result.success) {
    return null;
  }
  return result.data;
};

export async function delCache<T>(key: string, field: string) {
  return redis.hdel(key, field);
}
