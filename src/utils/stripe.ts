import { getApiKeyFromCache } from "./apikey";
import { z } from "zod";
import axios from "axios";

const createMeterEventSchema = z.object({
  apiKey: z.string(),
  value: z.number(),
});
export async function createMetreEvent(cacheKey: string, value: number) {
  const apiKey = await getApiKeyFromCache(cacheKey);
  await axios.post(
    `${process.env.PLATFORM_URL}/api/v1/createMeterEvent`,
    createMeterEventSchema.parse({
      apiKey,
      value,
    })
  );
}
