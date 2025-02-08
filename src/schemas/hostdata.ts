import { z } from "zod";

export const hostDataSchema = z.object({
  count: z.number(),
  explored: z.number(),
  links: z.array(z.object({ url: z.string(), scraped: z.boolean() })),
  scraped: z.boolean(),
});
export type HostData = z.infer<typeof hostDataSchema>;
