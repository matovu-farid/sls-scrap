import { z } from "zod";
import { jsonSchemaSchema } from "./jsonschema";

export const baseApiMessageSchema = z.object({
  url: z.string(),
  prompt: z.string(),
  callbackUrl: z.string(),
  id: z.string(),
  recursive: z.boolean(),
});

const textApiMessageSchema = baseApiMessageSchema.extend({
  type: z.literal("text"),
});

const structuredApiMessageSchema = baseApiMessageSchema.extend({
  type: z.literal("structured"),
  schema: jsonSchemaSchema,
});

export const apiMessageSchema = z.discriminatedUnion("type", [
  textApiMessageSchema,
  structuredApiMessageSchema,
]);

export type ApiMessage = z.infer<typeof apiMessageSchema>;
