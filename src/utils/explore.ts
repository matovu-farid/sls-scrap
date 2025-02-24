import { exploreUrlsAndQueue, getLinksForHost } from "@/utils/exploreHelpers";
// @ts-ignore
import { getBrowser } from "@/utils/getBrowser";
import { getHost } from "./get-host";
import { publishWebhook } from "./publishWebhook";
import { redis } from "@/entites/cache";

export async function explore(url: string) {
  
  const browser = await getBrowser();

  const page = await browser.newPage();
  await page.goto(url.toString());
  await getLinksForHost(page, getHost(url), url);
  const id = ((await redis.hget(getHost(url), "id")) as string) || "";


  await Promise.allSettled([ exploreUrlsAndQueue(url, page),
    publishWebhook(getHost(url), {
      id,
      type: "explore",
      data: {
        url,
      },
    })])
  browser.close();
}
