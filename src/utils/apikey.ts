import { redis } from "@/entites/cache";
import assert from "assert";
import axios, { AxiosError } from "axios";
import { z } from "zod";

const validateApiKeySchema = z.object({
  apiKey: z.string(),
});

const validateApiKeyResponseSchema = z.object({
  isValid: z.boolean(),
});

export async function isValidApiKey(apiKey: string) {
  const response = await axios
    .post(
      `${process.env.PLATFORM_URL!}/api/v1/validate`,
      validateApiKeySchema.parse({
        apiKey,
      })
    )
    .catch((error) => {
      if (error instanceof AxiosError) {
        console.error(`>>> ${error.cause}`);
        console.error(`>>> Apikey validation failed`, error.message);
        console.log(error.stack);
      }
      return {
        data: {
          isValid: false,
        },
      };
    });
  const data = validateApiKeyResponseSchema.parse(response.data);
  return data.isValid;
}

export async function getApiKeyFromCache(cacheKey: string) {
  const apiKey = await redis.hget(cacheKey, "signSecret");
  const apiKeyData = z.string().parse(apiKey);
  return apiKeyData;
}
