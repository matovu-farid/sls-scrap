import { aiMessageSchema } from "@/schemas/aiMessage";
import { scrape } from "@/utils/scrape";
import type { SQSEvent, Context, Callback } from "aws-lambda";
import { HostData, hostDataSchema } from "@/schemas/hostdata";
import { getCache, setCacheFor } from "@/entites/cache";
import { publishWebhook } from "@/utils/publishWebhook";
import { parseSNSMessegeInSQSRecord } from "@/utils/parse-sns";

export async function handler(
  event: SQSEvent,
  context: Context,
  done: Callback
) {
  const promises: Promise<any>[] = [];

  event.Records.forEach(async (record: any) => {
    const { host } = parseSNSMessegeInSQSRecord(record, aiMessageSchema);

    const cache = await getCache<HostData>(host, hostDataSchema);

    if (!cache) {
      return;
    }

    const results = await scrape(host, cache.prompt);
    if (!cache || !results) {
      return;
    }

    // await setCacheFor<HostData>(host)("$", true);

    await setCacheFor<HostData>(host)("$.result", results);

    await setCacheFor<HostData>(host)("$.stage", "ai");

    promises.push(
      publishWebhook(host, {
        type: "scraped",
        data: {
          url: host,
          results,
        },
      })
    );
  });

  await Promise.allSettled(promises);
  done(null, {
    statusCode: 200,
    body: "Success",
  });
}
