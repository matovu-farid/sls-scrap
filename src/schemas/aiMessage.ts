import { z } from "zod";

export const aiMessageSchema = z.object({
  host: z.string(),
  prompt: z.string(),
});

export type AiMessage = z.infer<typeof aiMessageSchema>;
