import { normalize } from "./utils/normalize";
import { delCache } from "./entites/cache";
import { ScrapMessage } from "./schemas/scapMessage";
import { push } from "./entites/sqs";

export const handler = async (event: any, context: any, done: any) => {
  const { url, prompt } = JSON.parse(event.body || "{}");

  const parsedURL = new URL(normalize(url));
  const host = parsedURL.host.replace("www.", "");
  await delCache(host);

  
  await push<ScrapMessage>({
    url: url,
    host,
    links: [],
    prompt,
    type: "explore",
  })

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
