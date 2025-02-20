import { z } from "zod";

export const linksSchema = z.object({
  type: z.literal("links"),
  data: z.object({
    links: z.array(z.string()),
    host: z.string(),
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
