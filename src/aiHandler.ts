import { aiMessageSchema } from "./schemas/aiMessage";
import { scrape } from "./scrape";
import type { SQSEvent, Context, Callback } from "aws-lambda";
// import { scrape } from "./scrape";

export async function handler(
  event: SQSEvent,
  context: Context,
  done: Callback
) {
  event.Records.forEach(async (record: any) => {
    console.log(record);
    const data = JSON.parse(record.body);

    const { host, prompt } = aiMessageSchema.parse(data);
    await scrape(host, prompt);
  });
  done(null, {
    statusCode: 200,
    body: "Success",
  });
}
