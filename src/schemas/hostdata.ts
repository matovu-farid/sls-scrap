import { z } from "zod";

export const hostDataSchema = z.object({
  stage: z.enum(["explore", "ai", "webhook"]),
  count: z.number(),
  explored: z.number(),
  links: z.array(z.object({ url: z.string(), scraped: z.boolean() })),
  scraped: z.boolean(),
  signSecret: z.string(),
  callbackUrl: z.string(),
  result: z.string().optional(),
  prompt: z.string(),
});
export type HostData = z.infer<typeof hostDataSchema>;
