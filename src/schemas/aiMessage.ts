import { z } from "zod";

export const aiMessageSchema = z.object({
  cacheKey: z.string(),
});

export type AiMessage = z.infer<typeof aiMessageSchema>;
