
import { exploreUrlsAndQueue } from "./exploreHelpers";
// @ts-ignore
import { getBrowser } from "./getBrowser.cjs";

export async function explore(
  url: string,
  prompt: string,
  host: string,
  links?: string[]
) {
  const browser = await getBrowser();
  const page = await browser.newPage();

  await exploreUrlsAndQueue(url, page, prompt, host, links);
  browser.close();
}
