import { aiMessageSchema } from "@/schemas/aiMessage";
import { scrape } from "@/utils/scrape";
import type { SQSEvent, Context, Callback } from "aws-lambda";
import { HostData, hostDataSchema } from "@/schemas/hostdata";
import { getCache } from "@/entites/cache";
import { publishWebhook } from "@/utils/publishWebhook";
import { parseSNSMessegeInSQSRecord } from "@/utils/parse-sns";
import { syncSetCache } from "@/utils/syncSetCache";

export async function handler(
  event: SQSEvent,
  context: Context,
  done: Callback
) {
  const promises: Promise<any>[] = [];
  event.Records.forEach(async (record: any) => {
    const { host, prompt } = parseSNSMessegeInSQSRecord(
      record,
      aiMessageSchema
    );

    const results = await scrape(host, prompt);
    const cache = await getCache<HostData>(host, hostDataSchema);
    if (!cache || !results) {
      return;
    }

    promises.push(
      syncSetCache<HostData>(
        host,
        async () => {
          const currentValue = await getCache<HostData>(host, hostDataSchema);
          if (!currentValue) {
            return null;
          }
          return {
            ...currentValue,
            result: results,
          };
        },
        host
      )
    );

    promises.push(
      publishWebhook(
        cache.callbackUrl,
        {
          type: "scraped",
          data: {
            url: host,
            results,
          },
        },
        cache.signSecret
      )
    );
  });

  await Promise.allSettled(promises);
  done(null, {
    statusCode: 200,
    body: "Success",
  });
}
