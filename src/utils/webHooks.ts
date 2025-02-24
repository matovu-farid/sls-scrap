import { z } from "zod";

export const linksSchema = z.object({
  type: z.literal("links"),
  data: z.object({
    links: z.array(z.string()),
    host: z.string(),
  }),
  id: z.string(),
});

export const scrapedSchema = z.object({
  type: z.literal("scraped"),
  data: z.object({
    url: z.string(),
    results: z.string(),
  }),
  id: z.string(),
});

export const exploreSchema = z.object({
  type: z.literal("explore"),
  data: z.object({
    url: z.string(),
  }),
  id: z.string(),
});
export type LinksEventData = z.infer<typeof linksSchema>;
export type ScrapedEventData = z.infer<typeof scrapedSchema>;
export type ExploreEventData = z.infer<typeof exploreSchema>;
export const webHookSchemaEventData = z.union([
  exploreSchema,
  linksSchema,
  scrapedSchema,
]);

export const webHookSchema = z.object({
  webhook: z.string(),
  data: webHookSchemaEventData,
  headers: z.record(z.string(), z.string()),
});
export type WebHookEvent = z.infer<typeof webHookSchema>;
export type WebHookEventData = z.infer<typeof webHookSchema>["data"];
export const isLinksEventData = (data: unknown): data is LinksEventData => {
  const parsed = webHookSchemaEventData.safeParse(data);
  if (!parsed.success) {
    throw new Error("Invalid webhook event");
  }
  return parsed.data.type === "links";
};
export const isScrapedEventData = (data: unknown): data is ScrapedEventData => {
  const parsed = webHookSchemaEventData.safeParse(data);
  if (!parsed.success) {
    throw new Error("Invalid webhook event");
  }
  return parsed.data.type === "scraped";
};

export const isExploreEventData = (data: unknown): data is ExploreEventData => {
  const parsed = webHookSchemaEventData.safeParse(data);
  if (!parsed.success) {
    throw new Error("Invalid webhook event");
  }
  return parsed.data.type === "explore";
};
