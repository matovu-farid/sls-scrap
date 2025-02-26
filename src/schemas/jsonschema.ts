import { z } from "zod";
import Ajv from "ajv";

// use ajv to validate the jsonschema
const ajv = new Ajv();

// Top-level JSON Schema definition.
export const jsonSchemaSchema = z.any().superRefine((data, ctx) => {
  const isValid = ajv.validateSchema(data);
  if (!isValid) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: ajv.errors?.map((e) => e.message).join(", "),
    });
  }
});

export type JsonSchema = z.infer<typeof jsonSchemaSchema>;
