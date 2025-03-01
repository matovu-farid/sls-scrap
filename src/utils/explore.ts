import { exploreUrlsAndQueue, getLinksForHost } from "@/utils/exploreHelpers";
// @ts-ignore
import { getBrowser } from "@/utils/getBrowser";
import { getHost } from "./get-host";
import { publishWebhook } from "./publishWebhook";
import { getCache } from "@/entites/cache";
import { HostData, hostDataSchema } from "@/schemas/hostdata";

export async function explore(url: string, cacheKey: string) {
  const browser = await getBrowser();

  const page = await browser.newPage();
  await page.goto(url.toString());
  await getLinksForHost(page, getHost(url), url, cacheKey);

  await exploreUrlsAndQueue(url, page, cacheKey);

  browser.close();
}
