import { explore } from "./explore";
import { scrape } from "./scrape";
// import { scrape } from "./scrape";

export async function handler(event: any, context: any, done: any) {
  event.Records.forEach(async (record: any) => {
    const { url, prompt, type, host, links } = JSON.parse(record.body);

    if (type === "explore") {
      await explore(url, prompt, host, links);
    } else if (type === "scrape") {
      console.log("Scraping", host);
      await scrape(host, prompt);
    } else {
      console.log("Unknown type", type);
    }
  });
  done(null, {
    statusCode: 200,
    body: "Success",
  });
}
