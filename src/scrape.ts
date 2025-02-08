import { generateText } from "ai";
import { getCache } from "./entites/cache";
import { getData, getS3Key, setData } from "./entites/s3";
import { hostDataSchema } from "./schemas/hostdata";
import { openai } from "@ai-sdk/openai";
import { publish } from "./entites/sns";

export const scrape = async (host: string, prompt: string) => {
  const content = await getContent(host);

  if (!content) {
    return null;
  }

  const textData = JSON.stringify(content);
  console.log({ textData });

  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    system:
      "You are provided with a list of urls and their content. You are to extract the key details from the content and reply to the prompt from the user in a clear meaningful way.",
    prompt: `<Prompt>
      ${prompt}
      </Prompt>
      <Details>
      ${textData}
      </Details>`,
  });
  await setData(`scraped-data/${getS3Key(host)}`, text);
  publish(process.env.SCRAPE_TOPIC_ARN || "", {
    url: host,
    type: "scrape",
  });

  return text;
};

export async function getContent(host: string) {
  if (typeof host !== "string") return "";
  const hostData = await getCache(host, hostDataSchema);
  if (!hostData) {
    return null;
  }

  const { links } = hostData;

  const content: Record<string, string> = {};
  for (const link of links) {
    const data = await getData(getS3Key(link.url), "url-data");
    if (data) {
      content[link.url] = data;
    }
  }
  return content;
}
