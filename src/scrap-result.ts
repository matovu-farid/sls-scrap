import axios from "axios";
import type { Context, Callback, SQSEvent } from "aws-lambda";
import { scrapResultSchema } from "@/schemas/scrapResult";
import { getData, getS3Key } from "@/entites/s3";
import { getCache } from "@/entites/cache";
import { hostDataSchema } from "./schemas/hostdata";
import crypto from "crypto";
import { publish } from "./entites/sns";
import { WebHookEvent } from "./call-webHooks";
export const handler = async (
  event: SQSEvent,
  context: Context,
  done: Callback
) => {
  event.Records.forEach(async (record: any) => {
    const data = JSON.parse(record.body);
    const { host } = scrapResultSchema.parse(data);
    //   await setData(`scraped-data/${getS3Key(host)}`, text);
    const results = (await getData(getS3Key(host), "scraped-data")) || "";
    const cachedData = await getCache(host, hostDataSchema);
    const timestamp = new Date().toISOString();

    const body = {
      url: host,
      results,
      timestamp,
    };
    const signature = crypto
      .createHmac("sha256", cachedData.signSecret)
      .update(`${timestamp}.${body}`)
      .digest("hex");

    // await axios.post(cachedData.callbackUrl, body, {
    //   headers: {
    //     "Content-Type": "application/json",
    //     "x-webhook-signature": signature,
    //     "x-webhook-timestamp": timestamp,
    //   },
    // });
    await publish<WebHookEvent>(process.env.WEBHOOK_TOPIC_ARN!, {
      webhook: cachedData.callbackUrl,
      data: body,
      headers: {
        "Content-Type": "application/json",
        "x-webhook-signature": signature,
        "x-webhook-timestamp": timestamp,
      },
    });
  });
};
