import { z } from "zod";

export const scrapMessageSchema = z.object({
  cacheKey: z.string(),
  url: z.string(),
});

export type ScrapMessage = z.infer<typeof scrapMessageSchema>;
