import type { Page } from "puppeteer-core";

import { getS3Key, setData } from "@/entites/s3";
import { getCache, redis } from "@/entites/cache";
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
  if (await redis.scard(`${host}-links`)) {
    return await redis.smembers(`${host}-links`);
  }
  console.log(">>> Querying links from page");
  const links = await getLinksFromPage(page, host, url);

  for (const link of links) {
    await redis.sadd(`${host}-links`, JSON.stringify(link));
    if (link === url) continue;
    await publish<ScrapMessage>(process.env.EXPLORE_BEGIN_TOPIC_ARN!, {
      url: link,
    });
  }

  await redis.hset(host, { found: links.length });

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

async function getLinksFromPage(page: Page, host: string, url: string) {
  const links = (await queryLinks(page)).map(normalize);

  const filteredLinks = Array.from(
    new Set([...links.filter((link) => new URL(link).host === host), url])
  );
  return filteredLinks;
}

export async function exploreUrlsAndQueue(url: string, page: Page) {
  const host = getHost(url);

  // Navigate the page to a URL

  const textContent = await page.evaluate(() => {
    return (
      //@ts-ignore
      Array.from(document.querySelectorAll("h1,h2, h3, h4, h5, h6, p"))
        //@ts-ignore
        .map((element) => element.innerText)
        .join("\n")
    );
  });

  await Promise.all([
    redis
      .multi()
      .sadd(`${host}-scrapedLinks`, JSON.stringify(url))
      .hincrby(host, "explored", 1)
      .exec(),
    setData(`url-data/${getS3Key(url)}`, textContent),
  ]);

  // TODO: Make sure the message is sent to ai when explored === count

  const cache = await getCache<HostData>(host, hostDataSchema);
  if (cache?.explored === cache?.found) {
    await Promise.allSettled([
      publish<AiMessage>(process.env.EXPLORE_DONE_TOPIC_ARN!, {
        host,
      }),
      redis.hset(host, {
        scraped: true,
      }),
    ]);
  }
}
