import { z } from "zod";

export const scrapMessageSchema = z.object({
  url: z.string(),
  host: z.string(),
  links: z.array(z.string()),
  prompt: z.string(),
  type: z.enum(["explore", "scrape"]),
});

export type ScrapMessage = z.infer<typeof scrapMessageSchema>;
