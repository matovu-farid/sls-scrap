import { aiMessageSchema } from "@/schemas/aiMessage";
import { scrape } from "@/utils/scrape";
import type { SQSEvent, Context, Callback } from "aws-lambda";
import { HostData, hostDataSchema } from "@/schemas/hostdata";
import { getCache, redis } from "@/entites/cache";
import { publishWebhook } from "@/utils/publishWebhook";
import { parseSNSMessegeInSQSRecord } from "@/utils/parse-sns";

export async function handler(
  event: SQSEvent,
  context: Context,
  done: Callback
) {
  const promises: Promise<any>[] = [];
  console.log(">>> AI processing started");

  event.Records.forEach(async (record: any) => {
    const { host } = parseSNSMessegeInSQSRecord(record, aiMessageSchema);

    const cache = await getCache<HostData>(host, hostDataSchema);

    await redis.hset(host, {
      stage: "ai",
    });

    if (!cache) {
      return;
    }

    const results = await scrape(host, cache.prompt);

    if (!cache || !results) {
      return;
    }
    const id = ((await redis.hget(host, "id")) as string) || "";

    promises.push(
      redis.hset(host, {
        result: results,
      }),
      publishWebhook(host, {
        id,
        type: "scraped",
        data: {
          url: host,
          results,
        },
      })
    );
  });

  await Promise.allSettled(promises);
  console.log(">>> AI processing done");
  done(null, {
    statusCode: 200,
    body: "Success",
  });
}
