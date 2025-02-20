import type { WebHookEvent, WebHookEventData } from "@/utils/webHooks";
import { publish } from "@/entites/sns";
import { getSigniture } from "@/utils/getSigniture";
import { HostData, hostDataSchema } from "@/schemas/hostdata";
import { getCache } from "@/entites/cache";

/**
 * Publish a webhook event to the SNS topic
 * @param webhook - The webhook to publish to
 * @param data - The data to publish
 * @param headers - The headers to publish
 */

export async function publishWebhook(
  host: string,
  data: WebHookEventData,
  
) {
  const timestamp = new Date().toISOString();
  const cache = await getCache<HostData>(host, hostDataSchema);
  if (!cache) {
    return;
  }
  const signature = getSigniture(data, cache.signSecret);
  const webhookEvent = {
    webhook: cache.callbackUrl,
    data,
    headers: {
      "Content-Type": "application/json",
      "x-webhook-signature": signature,
      "x-webhook-timestamp": timestamp,
    },
  } as WebHookEvent;
  await publish<WebHookEvent>(process.env.WEBHOOK_TOPIC_ARN!, webhookEvent);
}
