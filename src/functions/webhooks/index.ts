import type { Callback, Context, SQSEvent } from "aws-lambda";
import axios from "axios";
import { webHookSchema } from "@/utils/webHooks";
import { parseSNSMessegeInSQSRecord } from "@/utils/parse-sns";

export async function handler(
  event: SQSEvent,
  context: Context,
  done: Callback
) {
  console.log(">>> Webhooks processing started");
  const promises: Promise<any>[] = [];
  event.Records.forEach(async (record: any) => {
    const {
      webhook,
      data: webHookData,
      headers,
    } = parseSNSMessegeInSQSRecord(record, webHookSchema);
    promises.push(
      axios.post(webhook, webHookData, { headers }).then((response) => {
        console.log(response);
      })
    );
  });
  await Promise.allSettled(promises);
  console.log(">>> Webhooks processing done");
  done(null, "Success");
}
