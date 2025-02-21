import { z } from "zod";

export const hostDataSchema = z.object({
  stage: z.enum(["explore", "ai", "webhook", "api"]),

  links: z.array(z.string()),
  scrapedLinks: z.array(z.string()),
  scraped: z.boolean(),
  signSecret: z.string(),
  callbackUrl: z.string(),
  result: z.string(),
  prompt: z.string(),
  found: z.number(),
  explored: z.number(),
});
export type HostData = z.infer<typeof hostDataSchema>;

// export type HostPaths = Exclude<JSONPaths<HostData>, undefined>;
