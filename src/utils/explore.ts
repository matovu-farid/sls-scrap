import { exploreUrlsAndQueue, getLinksForHost } from "@/utils/exploreHelpers";
// @ts-ignore
import { getBrowser } from "@/utils/getBrowser";
import { getHost } from "./get-host";
import { publishWebhook } from "./publishWebhook";
import { getCache } from "@/entites/cache";
import { HostData, hostDataSchema } from "@/schemas/hostdata";

export async function explore(url: string) {
  
  const browser = await getBrowser();

  const page = await browser.newPage();
  await page.goto(url.toString());
  await getLinksForHost(page, getHost(url), url);
  const cache = await getCache<HostData>(getHost(url), hostDataSchema);
  


  await Promise.allSettled([ exploreUrlsAndQueue(url, page),
    publishWebhook(getHost(url), {
      id: cache?.id || "",
      type: "explore",
      data: {
        url,
        explored: cache?.explored || 0,
        found: cache?.found || 0,
      },
    }),
  ]);
  browser.close();
}
