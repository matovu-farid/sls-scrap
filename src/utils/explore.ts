import { exploreUrlsAndQueue } from "@/utils/exploreHelpers";
// @ts-ignore
import { getBrowser } from "@/utils/getBrowser";

export async function explore(
  url: string,
  prompt: string,
  host: string,
  callbackUrl: string,
  signSecret: string,
  links?: string[]
) {
  const browser = await getBrowser();
  const page = await browser.newPage();

  await exploreUrlsAndQueue(
    url,
    page,
    prompt,
    host,
    callbackUrl,
    signSecret,
    links
  );
  browser.close();
}
