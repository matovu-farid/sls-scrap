// import { explore } from "./explore";
// import { scrape } from "./scrape";
const { explore } = require("./explore");
const { scrape } = require("./scrape");

export async function handler(event, context, done) {
  event.Records.forEach(async (record) => {
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
