import { setCache } from "@/entites/cache";
import { Lock } from "@upstash/lock";
import { Redis } from "@upstash/redis";

export const syncSetCache = async <T>(
  key: string,
  getValue: () => Promise<T | null>,
  syncKey: string,
  lease: number = 5000
) => {
  const lock = new Lock({
    id: syncKey,
    lease, // Hold the lock for 5 seconds
    redis: Redis.fromEnv(),
  });
  if (await lock.acquire()) {
    const value = await getValue();
    if (!value) {
      await lock.release();
      return;
    }

    await setCache(key, value);
    await lock.release();
  } else {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await syncSetCache(key, getValue, syncKey, lease);
  }
};