import { redis } from "@/entites/cache";
import { ScrapMessage } from "@/schemas/scapMessage";
import { apiMessageSchema } from "@/schemas/apiMessage";
import type { APIGatewayProxyEvent, Context, Callback } from "aws-lambda";
import { publish } from "@/entites/sns";
import { getHost } from "@/utils/get-host";

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context,
  done: Callback
) => {
  const result = apiMessageSchema.safeParse(JSON.parse(event.body!));
  // get x-api-key from header
  const signSecret = event.headers["x-api-key"] || "";

  if (!result.success) {
    return {
      statusCode: 400,
      body: "Invalid request, missing url, prompt or callbackUrl",
    };
  }
  const { url, prompt, callbackUrl, id } = result.data;

  const host = getHost(url);
  await Promise.all([
    redis.del(host),
    redis.del(`${host}-links`),
    redis.del(`${host}-scrapedLinks`),
  ]);

  await Promise.allSettled([
    redis.hset(host, {
      scraped: false,
      signSecret,
      callbackUrl,
      prompt,
      stage: "api",
      found: 0,
      explored: 0,
      result: "",
      id,
    }),
    publish<ScrapMessage>(process.env.EXPLORE_BEGIN_TOPIC_ARN!, {
      url: url,
    }),
  ]);

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
