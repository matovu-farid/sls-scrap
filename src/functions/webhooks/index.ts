import type{ Callback, Context, SQSEvent } from "aws-lambda";
import axios from "axios";
import { webHookSchema } from "@/utils/webHooks";



export async function handler(
  event: SQSEvent,
  context: Context,
  done: Callback
) {
  console.log(event);
  event.Records.forEach(async (record: any) => {
    const data = JSON.parse(record.body);
    const { webhook, data: webHookData, headers } = webHookSchema.parse(data);
    const response = await axios.post(webhook, webHookData, { headers });
    console.log(response);
  });
  done(null, "Success");
}
