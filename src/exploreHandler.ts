import { explore } from "./explore";
import { scrapMessageSchema } from "./schemas/scapMessage";
import type { SQSEvent, Context, Callback } from "aws-lambda";

// import { scrape } from "./scrape";

export async function handler(
  event: SQSEvent,
  context: Context,
  done: Callback
) {
  event.Records.forEach(async (record: any) => {
    const data = JSON.parse(record.body);
    const { url, prompt, host, links } = scrapMessageSchema.parse(data);

    await explore(url, prompt, host, links);
  });
  done(null, {
    statusCode: 200,
    body: "Success",
  });
}
