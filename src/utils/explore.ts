import { exploreUrlsAndQueue, getLinksForHost } from "@/utils/exploreHelpers";
// @ts-ignore
import { getBrowser } from "@/utils/getBrowser";
import { getHost } from "./get-host";
import { publishWebhook } from "./publishWebhook";

export async function explore(url: string) {
  
  const browser = await getBrowser();

  const page = await browser.newPage();
  await page.goto(url.toString());
  await getLinksForHost(page, getHost(url), url);

  await Promise.allSettled([ exploreUrlsAndQueue(url, page),
    publishWebhook(getHost(url), {
      type: "explore",
      data: {
        url,
      },
    })])
  browser.close();
}
