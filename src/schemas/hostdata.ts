import { z } from "zod";
import { jsonSchemaSchema } from "./jsonschema";

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
  host: z.string(),
  recursive: z.boolean(),
});
const textHostDataSchema = baseHostDataSchema.extend({
  type: z.literal("text"),
});
const structuredHostDataSchema = baseHostDataSchema.extend({
  type: z.literal("structured"),
});

export const hostDataSchema = z.discriminatedUnion("type", [
  textHostDataSchema,
  structuredHostDataSchema,
]);
export type HostData = z.infer<typeof hostDataSchema>;
