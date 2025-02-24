import { z } from "zod";

export const baseApiMessageSchema = z.object({
  url: z.string(),
  prompt: z.string(),
  callbackUrl: z.string(),
  id: z.string().optional(),
});

const textApiMessageSchema = baseApiMessageSchema.extend({
  type: z.literal("text"),
});

const structuredApiMessageSchema = baseApiMessageSchema.extend({
  type: z.literal("structured"),
  schema: z.any(),
});

export const apiMessageSchema = z.discriminatedUnion("type", [
  textApiMessageSchema,
  structuredApiMessageSchema,
]);

export type ApiMessage = z.infer<typeof apiMessageSchema>;
