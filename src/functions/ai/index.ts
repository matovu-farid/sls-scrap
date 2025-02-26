import { aiMessageSchema } from "@/schemas/aiMessage";
import { scrape, scrapeStructured } from "@/utils/scrape";
import type { SQSEvent, Context, Callback } from "aws-lambda";
import { HostData } from "@/schemas/hostdata";
import { getCache, redis } from "@/entites/cache";
import { publishWebhook } from "@/utils/publishWebhook";
import { parseSNSMessegeInSQSRecord } from "@/utils/parse-sns";
import assert from "node:assert";

export async function handler(
  event: SQSEvent,
  context: Context,
  done: Callback
) {
  const promises: Promise<any>[] = [];
  console.log(">>> AI processing started");

  event.Records.forEach(async (record: any) => {
    const { cacheKey } = parseSNSMessegeInSQSRecord(record, aiMessageSchema);

    const cache = await redis.hmget<Pick<HostData, "prompt" | "type">>(
      cacheKey,
      "prompt",
      "type"
    );

    const schema = await redis.json.get(`${cacheKey}-schema`);
    assert.ok(cache, ">>> Cache is required for scraping");

    await redis.hset(cacheKey, {
      stage: "ai",
    });

    let results: string = "";
    if (cache.type === "text") {
      results = (await scrape(cacheKey, cache.prompt)) || "";
    } else {
      assert.ok(schema, ">>> Schema is required for structured scraping");
      results = (await scrapeStructured(cacheKey, cache.prompt, schema)) || "";
    }

    if (!cache || !results) {
      return;
    }
    const id = ((await redis.hget(cacheKey, "id")) as string) || "";

    promises.push(
      redis.hset(cacheKey, {
        result: results,
      }),
      publishWebhook(cacheKey, {
        id,
        type: "scraped",
        data: {
          url: cacheKey,
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
