import { jsonSchemaSchema } from "@/schemas/jsonschema";
import { jsonSchema } from "ai";
import Ajv from "ajv";
import { test, expect } from "bun:test";

// Test: Valid schema with required properties present
test("valid json schema", () => {
  const schema = {
    // $schema: "https://json-schema.org/draft/2020-12/schema",
    type: "object",
    properties: {
      recipe: {
        type: "object",
        properties: {
          name: { type: "string" },
          ingredients: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                amount: { type: "string" },
              },
              required: ["name", "amount"],
            },
          },
          steps: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: ["name", "ingredients", "steps"],
      },
    },
    required: ["recipe"],
  };
  const result = jsonSchemaSchema.safeParse(schema);
  console.log(result.error);

  expect(result.success).toBe(true);
});
