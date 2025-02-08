import {
  SQSClient,
  SendMessageCommand,
  ReceiveMessageCommand,
} from "@aws-sdk/client-sqs";

const sqsClient = new SQSClient({ region: "af-south-1" });

export async function push<T>(data: T) {
  await sqsClient.send(
    new SendMessageCommand({
      QueueUrl: process.env.QUEUE_URL,
      MessageBody: JSON.stringify(data),
    })
  );
}

export async function pop() {
  const data = await sqsClient.send(
    new ReceiveMessageCommand({
      QueueUrl: process.env.QUEUE_URL,
    })
  );
  return data;
}
