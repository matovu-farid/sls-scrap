import { getCache, redis } from "@/entites/cache";
import { explore } from "../../utils/explore";
import { HostData, hostDataSchema } from "@/schemas/hostdata";
import { scrapMessageSchema } from "@/schemas/scapMessage";
import type { SQSEvent, Context, Callback } from "aws-lambda";
import { parseSNSMessegeInSQSRecord } from "@/utils/parse-sns";

export async function handler(
  event: SQSEvent,
  context: Context,
  done: Callback
) {
  event.Records.forEach(async (record) => {
    const { url, cacheKey } = parseSNSMessegeInSQSRecord(record, scrapMessageSchema);

    const cache = await getCache<HostData>(cacheKey, hostDataSchema);
    if (cache?.scraped) {
      done(null, {
        statusCode: 200,
        body: "Success",
      });
      return;
    }

    await redis.hset(cacheKey, {
      stage: "explore",
    });

    if (!(await redis.sismember(`${cacheKey}-scrapedLinks`, url))) {
      await explore(url, cacheKey);
    }
  });
  done(null, {
    statusCode: 200,
    body: "Success",
  });
}
