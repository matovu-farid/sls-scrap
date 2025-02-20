import { normalize } from "@/utils/normalize";
import { delCache } from "@/entites/cache";
import { ScrapMessage } from "@/schemas/scapMessage";
import { apiMessageSchema } from "@/schemas/apiMessage";
import type { APIGatewayProxyEvent, Context, Callback } from "aws-lambda";
import { publish } from "@/entites/sns";
import { updateHostDataInCache } from "@/utils/updateHostDataInCache";

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
  const { url, prompt, callbackUrl } = result.data;
  const parsedURL = new URL(normalize(url));

  const host = parsedURL.host;
  await delCache(host);

  await publish<ScrapMessage>(process.env.EXPLORE_BEGIN_TOPIC_ARN!, {
    url: url,
    host,
    links: [],
    prompt,
    signSecret,
    callbackUrl,
  });

  await updateHostDataInCache(host, () => ({
    signSecret,
    callbackUrl,
  }));

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
