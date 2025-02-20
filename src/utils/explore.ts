import { exploreUrlsAndQueue } from "@/utils/exploreHelpers";
// @ts-ignore
import { getBrowser } from "@/utils/getBrowser";

export async function explore(
  url: string,
  

) {
  const browser = await getBrowser();
  const page = await browser.newPage();

  await exploreUrlsAndQueue(
    url,
    page,
   
  );
  browser.close();
}
