const express = require("express");
const path = require("path");
require("dotenv").config();

const puppeteerExtra = require("puppeteer-extra");
const stealth = require("puppeteer-extra-plugin-stealth");
puppeteerExtra.use(stealth());

const app = express();
const PORT = process.env.PORT || 10000;

// serve debug.png
app.get("/debug", (req, res) => {
  res.sendFile(path.join(__dirname, "debug.png"));
});

app.get("/", (req, res) => {
  res.send("Bot is running");
});

app.listen(PORT, () => {
  console.log("Web server running on port", PORT);
});

(async () => {
  const browser = await puppeteerExtra.launch({
    headless: true,
    executablePath: '/opt/render/project/src/.local-chrome/chrome/linux-127.0.6533.88/chrome-linux64/chrome',
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--single-process"
    ]
  });

  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  );

  await page.setViewport({ width: 1280, height: 800 });

  console.log("Opening Aternos...");
  await page.goto("https://aternos.org/go/", {
    waitUntil: "networkidle2",
    timeout: 60000
  });

  // give Cloudflare time
  await page.waitForTimeout(8000);

  const title = await page.title();
  console.log("Title:", title);

  await page.screenshot({ path: "debug.png", fullPage: true });
  console.log("Saved debug.png");

  if (title.includes("Just a moment")) {
    console.log("Blocked by anti-bot. Check debug.png.");
    return;
  }

  // login if not blocked
  await page.waitForSelector("#user", { timeout: 30000 });
  await page.type("#user", process.env.ATERNOS_EMAIL);
  await page.type("#password", process.env.ATERNOS_PASS);
  await page.click("#login");

  await page.waitForTimeout(5000);
  await page.screenshot({ path: "debug.png", fullPage: true });
  console.log("Logged in, new screenshot saved.");
})();
