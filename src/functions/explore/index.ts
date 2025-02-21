import { getCache } from "@/entites/cache";
import { explore } from "../../utils/explore";
import { HostData, hostDataSchema } from "@/schemas/hostdata";
import { scrapMessageSchema } from "@/schemas/scapMessage";
import type { SQSEvent, Context, Callback } from "aws-lambda";
import { parseSNSMessegeInSQSRecord } from "@/utils/parse-sns";
import { getHost } from "@/utils/get-host";

export async function handler(
  event: SQSEvent,
  context: Context,
  done: Callback
) {
  event.Records.forEach(async (record) => {
    const { url } = parseSNSMessegeInSQSRecord(record, scrapMessageSchema);
    const host = getHost(url);

    const cache = await getCache<HostData>(host, hostDataSchema);
    if (cache?.scraped) {
      done(null, {
        statusCode: 200,
        body: "Success",
      });
      return;
    }
    const link = cache?.scrapedLinks.find((link) => link === url);

    if (!link) {
      await explore(url);
    }
  });
  done(null, {
    statusCode: 200,
    body: "Success",
  });
}
