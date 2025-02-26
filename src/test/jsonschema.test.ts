import { jsonSchemaSchema, JsonSchema } from "@/schemas/jsonschema";
import { test, expect } from "bun:test";

// Test: Valid schema with required properties present
test("valid json schema", () => {
  const schema: JsonSchema = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    type: "object",
    properties: {
      title: {
        type: "string",
        description: "The title of the content",
      },
      summary: {
        type: "string",
        description: "A brief summary of the content",
      },
    },
    required: ["title", "summary"],
  };
  const result = jsonSchemaSchema.safeParse(schema);
  expect(result.success).toBe(true);
});

// Test: Object type property missing 'properties' should fail
test("object property without properties field should fail", () => {
  const schema = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    type: "object",
    properties: {
      details: {
        type: "object",
        // 'properties' is missing for an object type
      },
    },
    required: ["details"],
  };
  const result = jsonSchemaSchema.safeParse(schema);
  expect(result.success).toBe(false);
});

// Test: Array type property missing 'items' should fail
test("array property without items field should fail", () => {
  const schema = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    type: "object",
    properties: {
      tags: {
        type: "array",
        // 'items' is missing for an array type
      },
    },
    required: ["tags"],
  };
  const result = jsonSchemaSchema.safeParse(schema);
  expect(result.success).toBe(false);
});

// Test: Required property not defined in properties should fail
test("required property not defined in properties should fail", () => {
  const schema = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    type: "object",
    properties: {
      name: {
        type: "string",
      },
    },
    required: ["name", "age"], // 'age' is missing in properties
  };
  const result = jsonSchemaSchema.safeParse(schema);
  expect(result.success).toBe(false);
});

// Test: Invalid $schema URL should fail
test("invalid $schema URL should fail", () => {
  const schema = {
    $schema: "invalid-url",
    type: "object",
    properties: {
      title: {
        type: "string",
      },
    },
    required: ["title"],
  };
  const result = jsonSchemaSchema.safeParse(schema);
  expect(result.success).toBe(false);
});

// Test: Valid nested object and array schema
test("valid nested object and array schema", () => {
  const schema: JsonSchema = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    type: "object",
    properties: {
      data: {
        type: "object",
        properties: {
          list: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: {
                  type: "number",
                },
              },
            },
          },
        },
      },
    },
  };
  const result = jsonSchemaSchema.safeParse(schema);
  expect(result.success).toBe(true);
});

// Test: Valid schema with optional required array omitted
test("valid schema without required array", () => {
  const schema: JsonSchema = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    type: "object",
    properties: {
      description: {
        type: "string",
        description: "Optional description field",
      },
    },
  };
  const result = jsonSchemaSchema.safeParse(schema);
  expect(result.success).toBe(true);
});
