import { getCache } from "@/entites/cache";
import { explore } from "../../utils/explore";
import { HostData, hostDataSchema } from "@/schemas/hostdata";
import { scrapMessageSchema } from "@/schemas/scapMessage";
import type { SQSEvent, Context, Callback } from "aws-lambda";
import { parseSNSMessegeInSQSRecord } from "@/utils/parse-sns";
import { updateHostDataInCache } from "@/utils/updateHostDataInCache";

export async function handler(
  event: SQSEvent,
  context: Context,
  done: Callback
) {
  event.Records.forEach(async (record) => {
    const { url, prompt, host, callbackUrl, links, signSecret } =
      parseSNSMessegeInSQSRecord(record, scrapMessageSchema);
    updateHostDataInCache(host, () => ({
      stage: "explore",
    }));
    const cache = await getCache<HostData>(host, hostDataSchema);
    if (cache?.scraped) {
      return;
    }
    if (!cache?.links.find((link) => link.url === url)?.scraped) {
      await explore(url, prompt, host, callbackUrl, signSecret, links);
    }
  });
  done(null, {
    statusCode: 200,
    body: "Success",
  });
}
