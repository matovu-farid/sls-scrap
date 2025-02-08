const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");

async function getBrowser() {
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(
      process.env.AWS_EXECUTION_ENV
        ? "/opt/nodejs/node_modules/@sparticuz/chromium/bin"
        : undefined
    ),
    headless: "shell",
  });
  return browser;
}

module.exports = { getBrowser };
