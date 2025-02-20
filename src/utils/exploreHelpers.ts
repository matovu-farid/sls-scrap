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
  let links = passedLinks;
  if (!links || links.length == 0) {
    links = (await queryLinks(page)).map(normalize);
  }
  const filteredLinks = Array.from(
    new Set([...links.filter((link) => new URL(link).host === host), url])
  );
  return filteredLinks;
}

async function getLinkData(host: string, defaultHostData: HostData) {
  return (await getCache<HostData>(host, hostDataSchema)) || defaultHostData;
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
  if (!passedLinks || passedLinks.length === 0) {
    await publishWebhook(
      callbackUrl,
      {
        type: "links",
        data: {
          links,
          host,
        },
      },
      signSecret
    );
  }

  let cachedData = await getCache<HostData>(host, hostDataSchema);
  if (!cachedData || cachedData.count === 0) {
    await updateHostDataInCache(host, () => ({
      count: links.length,

      links: links.map((link) => ({
        url: link,
        scraped: false,
      })),
    }));
  }
  cachedData = await getCache<HostData>(host, hostDataSchema);

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
          host,
          links: cachedData?.links.map((url) => url.url),
          prompt,
          callbackUrl,
          signSecret,
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
        prompt,
      })
    );
  }
}
