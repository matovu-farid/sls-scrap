import { Callback, Context, SQSEvent } from "aws-lambda";
import axios from "axios";
import { z } from "zod";

// {
//     type: "links",
//     data: {
//         links: string[]
//     }
// }
// {
//     type: "scraped",
//     data: {
//         url: string,
//         results: string
//     }
// }

export const linksSchema = z.object({
  type: z.literal("links"),
  data: z.object({
    links: z.array(z.string()),
  }),
});

export const scrapedSchema = z.object({
  type: z.literal("scraped"),
  data: z.object({
    url: z.string(),
    results: z.string(),
  }),
});

type LinksEvent = z.infer<typeof linksEventWebHookSchema>;
export type LinksEventData = z.infer<typeof linksSchema>;
type ScrapedEvent = z.infer<typeof scrapedEventWebHookSchema>;
export type ScrapedEventData = z.infer<typeof scrapedSchema>;

export const linksEventWebHookSchema = z.object({
  webhook: z.string(),
  data: linksSchema,
  headers: z.record(z.string(), z.string()),
});

export const scrapedEventWebHookSchema = z.object({
  webhook: z.string(),
  data: scrapedSchema,
  headers: z.record(z.string(), z.string()),
});

export const webHookSchema = z.union([
  linksEventWebHookSchema,
  scrapedEventWebHookSchema,
]);
export type WebHookEvent = z.infer<typeof webHookSchema>;
export type WebHookEventData = z.infer<typeof webHookSchema>["data"];
export const isLinksEvent = (event: WebHookEvent): event is LinksEvent => {
  return event.data.type === "links";
};
export const isScrapedEvent = (event: WebHookEvent): event is ScrapedEvent => {
  return event.data.type === "scraped";
};

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
