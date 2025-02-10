
import { getCache } from "@/entites/cache";
import { getData, getS3Key } from "@/entites/s3";
import { hostDataSchema } from "@/schemas/hostdata";


export async function getContent(host: string) {
  if (typeof host !== "string") return "";
  const hostData = await getCache(host, hostDataSchema);
  if (!hostData) {
    return null;
  }

  const { links } = hostData;

  const content: Record<string, string> = {};
  for (const link of links) {
    const data = await getData(getS3Key(link.url), "url-data");
    if (data) {
      content[link.url] = data;
    }
  }
  return content;
}
