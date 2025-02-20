
import { aiMessageSchema } from "@/schemas/aiMessage";
import { scrape } from "@/utils/scrape";
import type { SQSEvent, Context, Callback } from "aws-lambda";
import { HostData, hostDataSchema } from "@/schemas/hostdata";
import { getCache } from "@/entites/cache";
import { publishWebhook } from "@/utils/publishWebhook";

export async function handler(
  event: SQSEvent,
  context: Context,
  done: Callback
) {
  event.Records.forEach(async (record: any) => {
    console.log(record);
    const data = JSON.parse(record.body);

    const { host, prompt } = aiMessageSchema.parse(data);

    const results = await scrape(host, prompt);
    const cache = await getCache<HostData>(host, hostDataSchema);
    if (!cache || !results) {
      return;
    }
    await publishWebhook(
      cache.callbackUrl,
      {
        type: "scraped",
        data: {
          url: host,
          results,
        },
      },
      cache.signSecret
    );
  });
  done(null, {
    statusCode: 200,
    body: "Success",
  });
}


