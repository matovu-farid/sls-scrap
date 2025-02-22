import { exploreUrlsAndQueue, getLinksForHost } from "@/utils/exploreHelpers";
// @ts-ignore
import { getBrowser } from "@/utils/getBrowser";
import { getHost } from "./get-host";

export async function explore(url: string) {
  const browser = await getBrowser();

  const page = await browser.newPage();
  await page.goto(url.toString());
  await getLinksForHost(page, getHost(url), url);

  await exploreUrlsAndQueue(url, page);
  browser.close();
}
