import { z } from "zod";

export const scrapResultSchema = z.object({
  host: z.string(),
});

export type ScrapResult = z.infer<typeof scrapResultSchema>;
