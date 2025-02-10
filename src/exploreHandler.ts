import { explore } from "./explore";
import { scrapMessageSchema } from "./schemas/scapMessage";
import type { SQSEvent, Context, Callback } from "aws-lambda";



export async function handler(
  event: SQSEvent,
  context: Context,
  done: Callback
) {
  event.Records.forEach(async (record: any) => {
    const data = JSON.parse(record.body);
    const { url, prompt, host, callbackUrl, links, signSecret } = scrapMessageSchema.parse(data);

    await explore(url, prompt, host, callbackUrl, signSecret, links);
  });
  done(null, {
    statusCode: 200,
    body: "Success",
  });
}
