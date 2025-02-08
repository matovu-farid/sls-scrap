import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import normalize from "normalize-url";

export const getS3Key = (url: string) => {
  const parsedURL = new URL(normalize(url));
  const host = parsedURL.host;
  const path = parsedURL.pathname;
  return `${host}${path}`;
};
const client = new S3Client({ region: "af-south-1" });

export async function getData(key: string, prefix: string) {
  const data = await client.send(
    new GetObjectCommand({
      Bucket: "scrappy-scrapped",
      Key: `${prefix ? `${prefix}/` : ""}${key}`,
    })
  );
  const body = await data.Body?.transformToString();
  if (!body) {
    return null;
  }

  return body;
}

export async function setData(key: string, data: string, prefix?: string) {
  await client.send(
    new PutObjectCommand({
      Bucket: "scrappy-scrapped",
      Key: `${prefix ? `${prefix}/` : ""}${key}`,
      Body: data,
      ContentType: "text/plain",
    })
  );
}
