import { generateText, generateObject, Schema, jsonSchema } from "ai";
import { getS3Key, setData } from "@/entites/s3";
import { openai } from "@ai-sdk/openai";
import { getContent } from "@/utils/content";

export const scrape = async (host: string, prompt: string) => {
  const content = await getContent(host);
  console.log(">>> content", content);

  if (!content) {
    return null;
  }

  const textData = JSON.stringify(content);

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
  console.log(">>> text", text);
  await setData(`scraped-data/${getS3Key(host)}`, text);

  return text;
};

export const scrapeStructured = async <T>(
  host: string,
  prompt: string,
  passedSchema: any
): Promise<string | null> => {
  const content = await getContent(host);

  if (!content) {
    return null;
  }

  const textData = JSON.stringify(content);
  const schema = jsonSchema<T>(passedSchema);

  const data = await generateObject<T>({
    model: openai("gpt-4o-mini"),
    schema,
    system:
      "You are provided with a list of urls and their content. You are to extract the key details from the content that match the provided schema.",
    prompt: `<Prompt>
        ${prompt}
        </Prompt>
        <Details>
        ${textData}
        </Details>`,
  });

  await setData(`scraped-structured/${getS3Key(host)}`, JSON.stringify(data));
  return JSON.stringify(data.object);
};
