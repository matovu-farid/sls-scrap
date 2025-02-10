import { z } from "zod";

export const apiMessageSchema = z.object({
  url: z.string(),
  prompt: z.string(),
  callbackUrl: z.string(),
});

export type ApiMessage = z.infer<typeof apiMessageSchema>;
