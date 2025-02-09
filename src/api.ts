import { normalize } from "./utils/normalize";
import { delCache } from "./entites/cache";
import { ScrapMessage } from "./schemas/scapMessage";
import { push } from "./entites/sqs";
import { apiMessageSchema } from "./schemas/apiMessage";

export const handler = async (event: any, context: any, done: any) => {
  const result = apiMessageSchema.safeParse(JSON.parse(event.body));

  if (!result.success) {
    return {
      statusCode: 400,
      body: "Invalid request, missing url or prompt",
    };
  }
  const { url, prompt } = result.data;
  const parsedURL = new URL(normalize(url));
  const host = parsedURL.host.replace("www.", "");
  await delCache(host);

  await push<ScrapMessage>({
    url: url,
    host,
    links: [],
    prompt,
  });

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
