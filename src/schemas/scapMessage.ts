import { z } from "zod";

export const scrapMessageSchema = z.object({
  url: z.string(),
});

export type ScrapMessage = z.infer<typeof scrapMessageSchema>;
