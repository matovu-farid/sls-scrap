import { z } from "zod";

// Define primitive and complex types separately.
const jsonPrimitiveTypes = z.union([
  z.literal("string"),
  z.literal("number"),
  z.literal("boolean"),
  z.literal("null")
]);

const complexTypes = z.union([
  z.literal("object"),
  z.literal("array")
]);

const typeSchema = z.union([jsonPrimitiveTypes, complexTypes]);

// Base property schema with an optional description.
const basePropertySchema = z.object({
  type: typeSchema,
  description: z.string().optional(),
});

// Extend the base with optional 'properties' (for objects) and 'items' (for arrays).
// The lazy loading allows for recursive definitions.
type Property = z.infer<typeof basePropertySchema> & {
  properties?: Record<string, Property>;
  items?: Property;
};

const propertySchema: z.ZodType<Property> = basePropertySchema.extend({
  properties: z
    .record(
      z.string(),
      z.lazy(() => propertySchema)
    )
    .optional(),
  items: z.lazy(() => propertySchema).optional(),
}).superRefine((data, ctx) => {
  if (data.type === "object" && !data.properties) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "An object type must define a 'properties' field.",
    });
  }
  if (data.type === "array" && !data.items) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "An array type must define an 'items' field.",
    });
  }
});

// Top-level JSON Schema definition.
export const jsonSchemaSchema = z.object({
  $schema: z.string().url(), // Ensuring the $schema is a valid URL.
  type: z.literal("object"), // The root schema must be an object.
  required: z.array(z.string()).optional(),
  properties: z.record(z.string(), propertySchema),
}).superRefine((data, ctx) => {
  // Check that each required property exists in the properties object.
  if (data.required) {
    for (const req of data.required) {
      if (!data.properties[req]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Required property "${req}" is not defined in the 'properties' field.`,
          path: ["required"],
        });
      }
    }
  }
});

export type JsonSchema = z.infer<typeof jsonSchemaSchema>;
