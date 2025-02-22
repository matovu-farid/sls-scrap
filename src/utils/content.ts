import { redis } from "@/entites/cache";
import { getData, getS3Key } from "@/entites/s3";

export async function getContent(host: string) {
  const links = await redis.smembers(`${host}-scrapedLinks`);

  const content: Record<string, string> = {};
  for (const link of links) {
    const data = await getData(getS3Key(link), "url-data");
    if (data) {
      content[link] = data;
    }
  }
  return content;
}
