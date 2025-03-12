import type { Page } from "puppeteer-core";

import { getS3Key, setData } from "@/entites/s3";
import { redis } from "@/entites/cache";
import { normalize } from "@/utils/normalize";
import { HostData } from "@/schemas/hostdata";
import { publish } from "@/entites/sns";
import type { AiMessage } from "@/schemas/aiMessage";
import { publishWebhook } from "@/utils/publishWebhook";
import { ScrapMessage } from "@/schemas/scapMessage";
import { z } from "zod";
import { createMetreEvent } from "./stripe";

const queryLinks = async (page: Page) => {
  return await page.evaluate(() => {
    return Array.from(document.querySelectorAll("a")).map((a) => a.href);
  });
};

export async function initLinksForHost(
  page: Page,
  host: string,
  url: string,
  cacheKey: string
) {
  if (await redis.scard(`${cacheKey}-links`)) {
    return;
  }
  console.log(">>> Querying links from page");
  const links = await getLinksFromPage(page, host, url);

  const tx = redis.multi();
  links.forEach((link) => {
    tx.sadd(`${cacheKey}-links`, JSON.stringify(link));
  });
  await Promise.allSettled([
    tx.exec(),
    createMetreEvent(cacheKey, links.length),
  ]);

  await Promise.all([
    links
      .filter((link) => link !== url)
      .map((link) => {
        publish<ScrapMessage>(process.env.EXPLORE_BEGIN_TOPIC_ARN!, {
          url: link,
          cacheKey,
        });
      }),
  ]);

  await redis.hset(cacheKey, { found: links.length });

  const id = ((await redis.hget(cacheKey, "id")) as string) || "";

  console.log(">>> Publishing webhook");
  await publishWebhook(cacheKey, {
    id,
    type: "links",
    data: {
      links,
      host,
    },
  });
}

async function getLinksFromPage(page: Page, host: string, url: string) {
  const rawLinks = await queryLinks(page);
  const links = [];
  for (const link of rawLinks) {
    if (!z.string().url().safeParse(link).success) continue;
    const normalizedLink = normalize(link);
    if (new URL(normalizedLink).host === host) {
      links.push(normalizedLink);
    }
  }

  return Array.from(new Set([...links, url]));
}

export async function exploreUrlsAndQueue(
  url: string,
  page: Page,
  cacheKey: string
) {
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
      .sadd(`${cacheKey}-scrapedLinks`, JSON.stringify(url))
      .hincrby(cacheKey, "explored", 1)
      .exec(),
    setData(`url-data/${getS3Key(url, cacheKey)}`, textContent),
  ]);

  // TODO: Make sure the message is sent to ai when explored === count

  const cache = await redis.hmget<Pick<HostData, "id" | "explored" | "found">>(
    cacheKey,
    "id",
    "explored",
    "found"
  );
  await publishWebhook(cacheKey, {
    id: cache?.id || "",
    type: "explore",
    data: {
      url,
      explored: cache?.explored || 0,
      found: cache?.found || 0,
    },
  });

  if (cache?.explored === cache?.found) {
    await Promise.allSettled([
      publish<AiMessage>(process.env.EXPLORE_DONE_TOPIC_ARN!, {
        cacheKey,
      }),
      redis.hset(cacheKey, {
        scraped: true,
      }),
    ]);
  }
}
