import express from "express";
import type { Server } from "http";
import bodyParser from "body-parser";
import { hash } from "@/utils/getSigniture.js";
import { expect, it, describe, beforeAll, afterAll, jest } from "bun:test";
import { webHookSchema, webHookSchemaEventData } from "@/utils/webHooks";
import { handler } from "@/functions/api";
import type { APIGatewayProxyEvent, Callback, Context } from "aws-lambda";
import assert from "assert";
import axios from "axios";

const app = express();
let server: Server;

describe("scrape api", () => {
  beforeAll(() => {
    app.use(bodyParser.json());
    server = app.listen(3000, () => {
      console.log("Server is running on port 3000 for testing");
    });
  });

  afterAll(() => {
    server.close();
  });
  it(
    "should call the scrape api and return results via a webhook",
    async () => {
      let isCalled = false;
      let areResultsReturned = false;
      // setup
      app.post("/api/scrape-callback", async (req, res) => {
        isCalled = true;
        const headersList = req.headers;
        const rawBody = req.body;

        expect(headersList["x-webhook-signature"]).toBeDefined();
        expect(headersList["x-webhook-timestamp"]).toBeDefined();
        expect(webHookSchemaEventData.safeParse(rawBody).success).toBe(true);
        const parsed = webHookSchemaEventData.safeParse(rawBody);
        assert(parsed.success);
        const body = parsed.data;

        if (body.type === "scraped") {
          expect(body.data.results).toBeDefined();
          areResultsReturned = true;
        } else if (body.type === "links") {
          expect(body.data.links).toBeDefined();
          expect(body.data.host).toBeDefined();
        } else if (body.type === "explore") {
          expect(body.data.explored).toBeDefined();
          expect(body.data.found).toBeDefined();
        } else {
          expect(false).toBe(true);
        }

        res.send("ok");
      });

      // const FakeAPIGatewayProxyEvent = {
      //   body: JSON.stringify({
      //     url: "https://matovu-farid.com",
      //     prompt: "What is this website about?",
      //     callbackUrl: process.env.TEST_SCRAP_CALLBACK_URL!,
      //     id: "test_id",
      //     type: "text",
      //     recursive: true,
      //   }),
      //   headers: {
      //     "x-api-key": process.env.TEST_SCRAP_API_KEY!,
      //   },
      // };
      // const FakeContext = {};
      // const FakeCallback = () => {};
      await axios.post(
        "https://cxv2yfzmd4dnzmqjrb3byt25sm0zqdia.lambda-url.af-south-1.on.aws",
        {
          url: "https://matovu-farid.com",
          prompt: "What is this website about?",
          callbackUrl: process.env.TEST_SCRAP_CALLBACK_URL!,
          id: "test_id",
          type: "text",
          recursive: true,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.TEST_SCRAP_API_KEY!,
          },
        }
      );
      // act
      // await handler(
      //   FakeAPIGatewayProxyEvent as unknown as APIGatewayProxyEvent,
      //   FakeContext as unknown as Context,
      //   FakeCallback as unknown as Callback
      // );

      await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          expect(isCalled).toBe(true);
          expect(areResultsReturned).toBe(true);
          resolve(true);
        }, 3 * 60 * 1000);

        let intervalTimer: NodeJS.Timer;

        intervalTimer = setInterval(() => {
          if (areResultsReturned && isCalled) {
            clearInterval(intervalTimer);
            clearTimeout(timeout);
            resolve(true);
          }
          console.log(">>> Waiting for results ...");
        }, 1000);
      });
    },
    5 * 60 * 1000
  );
});
