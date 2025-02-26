import { redis } from "@/entites/cache";
import { ScrapMessage } from "@/schemas/scapMessage";
import { ApiMessage, apiMessageSchema } from "@/schemas/apiMessage";
import type { APIGatewayProxyEvent, Context, Callback } from "aws-lambda";
import { publish } from "@/entites/sns";
import { getHost } from "@/utils/get-host";
import { HostData } from "@/schemas/hostdata";

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context,
  done: Callback
) => {
  console.log(">>> Api Request processing started");
  const result = apiMessageSchema.safeParse(JSON.parse(event.body!));
  // get x-api-key from header
  const signSecret = event.headers["x-api-key"] || "";

  if (!result.success) {
    return {
      statusCode: 400,
      body: "Invalid request, missing url, prompt or callbackUrl",
    };
  }
  const data = result.data;
  const { url, prompt, callbackUrl, id, type } = data;
  


  const host = getHost(url);
  await redis
    .multi()
    .del(host)
    .del(`${host}-links`)
    .del(`${host}-scrapedLinks`)
    .exec();
  const baseApiMessage = {
    scraped: false,
    signSecret,
    callbackUrl,
    prompt,
    stage: "api",
    found: 0,
    explored: 0,
    result: "",
    id: id || "",
    
  }
  let  apiMessage;
  if( type === "text"){
    await redis.hset(host, {
      ...baseApiMessage,
      type: "text",
    })
  } else {
    await redis.hset(host,{
      ...baseApiMessage,
      type: "structured",
      schema: data.schema || undefined,
    })
  }
  
 

  
  await publish<ScrapMessage>(process.env.EXPLORE_BEGIN_TOPIC_ARN!, {
    url: url,
  }),
    console.log(">>> Api Request processing completed");

  done(null, {
    statusCode: 200,
    body: JSON.stringify({
      url,
      prompt,
      success: "True",
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });
};
