const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Bot is alive. Regrettably.");
});

app.listen(PORT, () => {
  console.log(`Web server running on port ${PORT}`);
});

const puppeteer = require('puppeteer');
require('dotenv').config();

const EMAIL = process.env.ATERNOS_EMAIL;
const PASSWORD = process.env.ATERNOS_PASS;
const SERVER_ID = 'bhRApseisxbc98cx';

const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/opt/render/project/src/.local-chrome/chrome/linux-127.0.6533.88/chrome-linux64/chrome',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--single-process',
      '--disable-gpu'
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // LOGIN PAGE
  await page.goto('https://aternos.org/go/', { waitUntil: 'domcontentloaded' });

  // DEBUG SCREENSHOT
  await page.screenshot({ path: 'debug.png' });
  console.log("Saved debug.png");
  console.log("Title:", await page.title());

  // ANTI-BOT DETECTION
  const html = await page.content();
  if (
    html.includes('cloudflare') ||
    html.includes('captcha') ||
    html.includes('Just a moment')
  ) {
    console.log("Blocked by anti-bot. Check debug.png.");
    process.exit(1);
  }

  // SAFE CLICK
  async function safeClick(selector) {
    await page.waitForSelector(selector, { visible: true, timeout: 60000 });
    const el = await page.$(selector);
    await el.evaluate(e => e.scrollIntoView({ block: 'center' }));
    await el.click({ delay: 50 });
  }

  // LOGIN
  await page.waitForSelector('.username', { visible: true, timeout: 60000 });
  await page.type('.username', EMAIL);
  await page.waitForSelector('.password');
  await page.type('.password', PASSWORD);
  await page.click('.login-button');
  await page.waitForNavigation({ waitUntil: 'networkidle2' });
  console.log('Logged in');

  // OPEN SERVER
  async function openServer() {
    console.log('Trying to open server...');
    await safeClick(`a.servercard[data-id="${SERVER_ID}"]`);
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    await sleep(2000);
    console.log('Opened server');
  }

  await openServer();

  // MAIN LOOP
  let failedAttempts = 0;

  while (true) {
    let clicked = false;

    const restartBtn = await page.$('#restart');
    if (restartBtn) {
      try {
        await safeClick('#restart');
        console.log('Restart clicked, waiting 1h');
        clicked = true;
        failedAttempts = 0;
        await sleep(3600000);
      } catch {}
    }

    if (!clicked) {
      const startBtn = await page.$('#start');
      if (startBtn) {
        try {
          await safeClick('#start');
          console.log('Start clicked, waiting 1h');
          clicked = true;
          failedAttempts = 0;
          await sleep(3600000);
        } catch {}
      }
    }

    if (!clicked) {
      failedAttempts++;
      console.log('No button, attempt', failedAttempts);
      if (failedAttempts >= 2) {
        await openServer();
        failedAttempts = 0;
      } else {
        await sleep(10000);
      }
    }
  }
})();
