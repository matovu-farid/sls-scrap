import { redis } from "@/entites/cache";
import { ScrapMessage } from "@/schemas/scapMessage";
import { apiMessageSchema } from "@/schemas/apiMessage";
import type { APIGatewayProxyEvent, Context, Callback } from "aws-lambda";
import { publish } from "@/entites/sns";
import { getHost } from "@/utils/get-host";
import assert from "node:assert";
import { createCacheKey } from "@/utils/cacheKey";
import { isValidApiKey } from "@/utils/apikey";
import { recursiveSearch } from "@/utils/print_paths";

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context,
  done: Callback
) => {
  console.log(">>> Api Request processing started");

  const result = apiMessageSchema.safeParse(JSON.parse(event.body!));
  // get x-api-key from header
  const apiKey = event.headers["x-api-key"] || "";
  const isApikeyValid = await isValidApiKey(apiKey);
  if (!isApikeyValid && process.env.NODE_ENV !== "test") {
    return {
      statusCode: 401,
      body: "Invalid API key",
    };
  }

  if (!result.success) {
    console.log(">>> Api Request processing failed", result.error);
    return {
      statusCode: 400,
      body: "Invalid request, missing url, prompt, or callbackUrl",
    };
  }
  const data = result.data;
  const { url, prompt, callbackUrl, id, type } = data;

  const host = getHost(url);
  const cacheKey = createCacheKey(apiKey, id);
  await redis
    .multi()
    .del(cacheKey)
    .del(`${cacheKey}-links`)
    .del(`${cacheKey}-scrapedLinks`)
    .exec();
  const baseApiMessage = {
    scraped: false,
    signSecret: apiKey,
    callbackUrl,
    prompt,
    stage: "api",
    found: 0,
    explored: 0,
    result: "",
    id: id || "",
    host: host,
  };
  if (type === "text") {
    await redis.hset(cacheKey, {
      ...baseApiMessage,
      type: "text",
    });
  } else {
    assert.ok(data.schema, ">>> Schema is required for structured scraping");

    await redis
      .multi()
      .hset(cacheKey, {
        ...baseApiMessage,
        type: "structured",
      })
      .json.set(`${cacheKey}-schema`, "$", data.schema!)
      .exec();
  }

  await publish<ScrapMessage>(process.env.EXPLORE_BEGIN_TOPIC_ARN!, {
    cacheKey,
    url: url,
  });
  console.log(">>> Api Request processing completed");

  done(null, {
    statusCode: 200,
    body: JSON.stringify({
      url,
      prompt,
      success: "True",
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });
};
