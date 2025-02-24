import { z } from "zod";

export const baseHostDataSchema = z.object({
  stage: z.enum(["explore", "ai", "webhook", "api"]),

  scraped: z.boolean(),
  signSecret: z.string(),
  callbackUrl: z.string(),
  result: z.string(),
  prompt: z.string(),
  found: z.number(),
  explored: z.number(),
  id: z.string(),
});
const textHostDataSchema = baseHostDataSchema.extend({
  type: z.literal("text"),
});
const structuredHostDataSchema = baseHostDataSchema.extend({
  type: z.literal("structured"),
  schema: z.any(),
});

export const hostDataSchema = z.discriminatedUnion("type", [
  textHostDataSchema,
  structuredHostDataSchema,
]);
export type HostData = z.infer<typeof hostDataSchema>;
