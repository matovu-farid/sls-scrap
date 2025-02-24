import { z } from "zod";

export const apiMessageSchema = z.object({
  url: z.string(),
  prompt: z.string(),
  callbackUrl: z.string(),
  id: z.string().optional(),
  type: z.enum(["text", "structured"]),
});

export type ApiMessage = z.infer<typeof apiMessageSchema>;
