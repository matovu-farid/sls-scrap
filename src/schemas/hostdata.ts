import { z } from "zod";

export const hostDataSchema = z.object({
  stage: z.enum(["explore", "ai", "webhook", "api"]),

  scraped: z.boolean(),
  signSecret: z.string(),
  callbackUrl: z.string(),
  result: z.string(),
  prompt: z.string(),
  found: z.number(),
  explored: z.number(),
});
export type HostData = z.infer<typeof hostDataSchema>;

