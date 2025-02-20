import type { SNSMessage, SQSRecord } from "aws-lambda";
import { z } from "zod";

export function parseSNSMessegeInSQSRecord<T>(
  record: SQSRecord,
  schema: z.ZodSchema<T>
): T {
  const data = JSON.parse(record.body) as SNSMessage;

  return schema.parse(JSON.parse(data.Message));
}
