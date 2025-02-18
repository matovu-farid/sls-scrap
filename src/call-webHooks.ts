import { Callback, Context, SQSEvent } from "aws-lambda";
import axios from "axios";
import { z } from "zod";
const webHookSchema = z.object({
  webhook: z.string(),
  data: z.record(z.string(), z.any()),
  headers: z.record(z.string(), z.string()),
});
export type WebHookEvent = z.infer<typeof webHookSchema>;
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
