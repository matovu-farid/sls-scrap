import type { Page } from "puppeteer-core";

import { getS3Key, setData } from "@/entites/s3";
import { getCache } from "@/entites/cache";
import { syncSetCache } from "@/utils/syncSetCache";
import { normalize } from "@/utils/normalize";
import { HostData, hostDataSchema } from "@/schemas/hostdata";
import { push } from "@/entites/sqs";
import type { ScrapMessage } from "@/schemas/scapMessage";
import { publish } from "@/entites/sns";
import type { AiMessage } from "@/schemas/aiMessage";
import { publishWebhook } from "@/utils/publishWebhook";
import { updateHostDataInCache } from "./updateHostDataInCache";
import { getHost } from "./get-host";

const queryLinks = async (page: Page) => {
  return await page.evaluate(() => {
    return Array.from(document.querySelectorAll("a")).map((a) => a.href);
  });
};

async function getLinksForHost(page: Page, host: string, url: string) {
  const cache = await getCache<HostData>(host, hostDataSchema);
  if (cache && cache.links.length > 0) {
    return await getLinksFromCache(host);
  }
  const links = await getLinksFromPage(page, host, url);
  await updateHostDataInCache(host, () => ({
    count: links?.length,

    links: links?.map((link) => ({
      url: link,
      scraped: false,
    })),
  }));

  publishWebhook(
    cache?.callbackUrl || "",
    {
      type: "links",
      data: {
        links,
        host,
      },
    },
    cache?.signSecret || ""
  );
  return links;
}

async function getLinksFromCache(host: string) {
  const cache = await getCache<HostData>(host, hostDataSchema);
  return cache?.links.map((link) => link.url) || [];
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
  await page.goto(url.toString());
  await getLinksForHost(page, host, url);
  

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

  const operations: Promise<any>[] = [];
  operations.push(setData(`url-data/${getS3Key(url)}`, textContent));

  cachedData?.links
    .filter((link) => !link.scraped)
    .forEach((link) => {
      operations.push(
        publish<ScrapMessage>(process.env.EXPLORE_BEGIN_TOPIC_ARN!, {
          url: link.url,
        })
      );
    });
  // operations.push(
  //   syncSetCache<HostData>(
  //     host,
  //     async () => {
  //       const { links, explored } =
  //         (await getCache<HostData>(host, hostDataSchema)) || defaultHostData;
  //       const link = linkData.find((link) => link.url === url);
  //       if (!link || link?.scraped) {
  //         return null;
  //       }
  //       const exploredCount = Math.min(explored + 1, linkData.length);
  //       return {
  //         stage: "explore",
  //         count: links.length,
  //         explored: exploredCount,
  //         links: links.map((link) => {
  //           if (link.url === url) {
  //             return {
  //               ...link,
  //               scraped: true,
  //             };
  //           }
  //           return link;
  //         }),
  //         scraped: exploredCount === links.length,
  //         callbackUrl,
  //         signSecret,
  //       };
  //     },
  //     "host-data"
  //   )
  // );
  operations.push(
    updateHostDataInCache(
      host,
      (currentValue) => {
        const exploredCount = Math.min(
          currentValue.explored + 1,
          currentValue.links.length
        );
        return {
          count: currentValue.links.length,
          explored: exploredCount,
          scraped: exploredCount === currentValue.links.length,
          links: currentValue.links.map((link) => {
            if (link.url === url) {
              return {
                ...link,
                scraped: true,
              };
            }
            return link;
          }),
        };
      },
      (currentValue) => {
        const link = currentValue.links.find((link) => link.url === url);
        return !!(link && !link.scraped);
      }
    )
  );

  await Promise.all(operations);
  const cache = await getCache<HostData>(host, hostDataSchema);
  if (cache?.scraped) {
    operations.push(
      publish<AiMessage>(process.env.EXPLORE_DONE_TOPIC_ARN!, {
        host,
      })
    );
  }
}
