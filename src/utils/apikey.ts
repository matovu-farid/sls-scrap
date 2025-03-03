import { redis } from "@/entites/cache";
import assert from "assert";
import axios from "axios";
import { z } from "zod";

const validateApiKeySchema = z.object({
    apiKey: z.string(),
  });

  const validateApiKeyResponseSchema = z.object({
    isValid: z.boolean(),
  });

export async function isValidApiKey(apiKey: string) {
  const response = await axios.post(
    `${process.env.PLATFORM_URL}/api/v1/validate`,
    validateApiKeySchema.parse({
      apiKey,
    })
  );
  const data = validateApiKeyResponseSchema.parse(response.data);
  return data.isValid;
}





export async function getApiKeyFromCache(cacheKey: string) {
  const apiKey = await redis.hget(cacheKey, "signSecret");
  const apiKeyData = z.string().parse(apiKey);
  return apiKeyData;
}
