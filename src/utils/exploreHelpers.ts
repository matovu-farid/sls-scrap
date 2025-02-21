import type { Page } from "puppeteer-core";

import { getS3Key, setData } from "@/entites/s3";
import { appendCacheFor, getCache, incrementCacheFor, setCacheFor } from "@/entites/cache";
import { normalize } from "@/utils/normalize";
import { HostData, hostDataSchema } from "@/schemas/hostdata";
import { publish } from "@/entites/sns";
import type { AiMessage } from "@/schemas/aiMessage";
import { publishWebhook } from "@/utils/publishWebhook";
import { getHost } from "./get-host";
import { ScrapMessage } from "@/schemas/scapMessage";

const queryLinks = async (page: Page) => {
  return await page.evaluate(() => {
    return Array.from(document.querySelectorAll("a")).map((a) => a.href);
  });
};

export async function getLinksForHost(page: Page, host: string, url: string) {
  const cache = await getCache<HostData>(host, hostDataSchema);
  console.log("cache", cache);
  if (cache && cache.links.length > 0) {
    return await getLinksFromCache(host);
  }
  console.log(">>> Querying links from page");
  const links = await getLinksFromPage(page, host, url);
  console.log(">>> Links from page", links);
  console.log(">>> Updating host data in cache");

  await setCacheFor<HostData>(host)("$.links", links);
  await setCacheFor<HostData>(host)("$.found", links.length);

  console.log(">>> Publishing webhook");
  await publishWebhook(host, {
    type: "links",
    data: {
      links,
      host,
    },
  });
  return links;
}

async function getLinksFromCache(host: string) {
  const cache = await getCache<HostData>(host, hostDataSchema);
  return cache?.links || [];
}

async function getLinksFromPage(page: Page, host: string, url: string) {
  const links = (await queryLinks(page)).map(normalize);
  console.log(">>>All Links from page", host, links);

  const filteredLinks = Array.from(
    new Set([...links.filter((link) => new URL(link).host === host), url])
  );
  return filteredLinks;
}

export async function exploreUrlsAndQueue(url: string, page: Page) {
  const host = getHost(url);

  // Navigate the page to a URL

  const cachedData = await getCache<HostData>(host, hostDataSchema);

  const textContent = await page.evaluate(() => {
    return (
      //@ts-ignore
      Array.from(document.querySelectorAll("h1,h2, h3, h4, h5, h6, p"))
        //@ts-ignore
        .map((element) => element.innerText)
        .join("\n")
    );
  });

  await appendCacheFor<HostData>(host)("$.scrapedLinks", url);
  await incrementCacheFor<HostData>(host )("$.explored");

  await setData(`url-data/${getS3Key(url)}`, textContent);

  if (cachedData?.links) {
    for (const link of cachedData.links) {
      if (!cachedData.scrapedLinks || !cachedData.scrapedLinks.includes(link)) {
        await publish<ScrapMessage>(process.env.EXPLORE_BEGIN_TOPIC_ARN!, {
          url: link,
        });
      }
    }
  }

  const scrapedLinks = [...(cachedData?.scrapedLinks || []), url];



  const cache = await getCache<HostData>(host, hostDataSchema);
  if (cache?.scraped) {
    await publish<AiMessage>(process.env.EXPLORE_DONE_TOPIC_ARN!, {
      host,
    });
  }
}
