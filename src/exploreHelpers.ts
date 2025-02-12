import type { Page } from "puppeteer-core";

import { getS3Key, setData } from "./entites/s3";
import { getCache, setCache } from "./entites/cache";
import { normalize } from "./utils/normalize";
import { hostDataSchema } from "./schemas/hostdata";
import { push } from "./entites/sqs";
import { ScrapMessage } from "./schemas/scapMessage";
import { publish } from "./entites/sns";
import { AiMessage } from "./schemas/aiMessage";

const queryLinks = async (page: Page) => {
  return await page.evaluate(() => {
    return Array.from(document.querySelectorAll("a")).map((a) => a.href);
  });
};

async function getLinksForHost(
  page: Page,
  host: string,
  url: string,
  passedLinks?: string[]
) {
  const links = passedLinks || (await queryLinks(page)).map(normalize);
  const filteredLinks = Array.from(
    new Set([
      ...links.filter((link) => new URL(normalize(link)).host === host),
      url,
    ])
  );
  return filteredLinks;
}

export async function exploreUrlsAndQueue(
  passedUrl: string,
  page: Page,
  prompt: string,
  passedHost: string,
  callbackUrl: string,
  signSecret: string,
  passedLinks?: string[]
) {
  const url = normalize(passedUrl);
  const parsedURL = new URL(url);
  const host = passedHost || parsedURL.host;

  // Navigate the page to a URL
  await page.goto(parsedURL.toString());
  const links = await getLinksForHost(page, host, url, passedLinks);

  const { explored, links: linkData } = (await getCache(
    host,
    hostDataSchema
  )) || {
    count: links.length,
    explored: 0,
    links: links.map((link) => ({
      url: link,
      scraped: false,
    })),
    scraped: false,
    signSecret,
  };

  const link = linkData.find((link) => link.url === url);
  if (!link || link.scraped) {
    return null;
  }

  const textContent = await page.evaluate(() => {
    return (
      //@ts-ignore
      Array.from(document.querySelectorAll("h1,h2, h3, h4, h5, h6, p"))
        //@ts-ignore
        .map((element) => element.innerText)
        .join("\n")
    );
  });

  const operations: Promise<any>[] = [];
  operations.push(setData(`url-data/${getS3Key(url)}`, textContent));

  linkData
    .filter((link) => !link.scraped)
    .forEach((link) => {
      operations.push(
        push<ScrapMessage>({
          url: link.url,
          host,
          links: linkData.map((url) => url.url),
          prompt,
          callbackUrl,
          signSecret,
        })
      );
    });
  operations.push(
    setCache(host, {
      count: linkData.length,
      explored: explored + 1,
      links: linkData.map((link) => {
        if (link.url === url) {
          return {
            ...link,
            scraped: true,
          };
        }
        return link;
      }),
      scraped: explored + 1 === linkData.length,
    })
  );

  await Promise.all(operations);
  const cache = await getCache(host, hostDataSchema);
  if (cache.scraped) {
    operations.push(
      publish<AiMessage>(process.env.EXPLORE_DONE_TOPIC_ARN || "", {
        host,
        prompt,
        callbackUrl,
      })
    );
  }
}
