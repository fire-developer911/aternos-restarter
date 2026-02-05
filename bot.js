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
require('dotenv').config(); // loads .env into process.env

const EMAIL = process.env.ATERNOS_EMAIL;
const PASSWORD = process.env.ATERNOS_PASS;
const SERVER_ID = 'bhRApseisxbc98cx';

const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    headless: true, // must be true in cloud
    executablePath: '/opt/render/project/src/.local-chrome/chrome/linux-127.0.6533.88/chrome-linux64/chrome',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // SAFE CLICK FUNCTION
  async function safeClick(selector) {
    await page.waitForSelector(selector, { visible: true });
    const el = await page.$(selector);
    await el.evaluate(e => e.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await el.click({ delay: 50 });
  }

  // LOGIN
  await page.goto('https://aternos.org/go/', { waitUntil: 'networkidle2' });
  await page.waitForSelector('.username');
  await page.type('.username', EMAIL);
  await page.waitForSelector('.password');
  await page.type('.password', PASSWORD);
  await page.click('.login-button');
  await page.waitForNavigation({ waitUntil: 'networkidle2' });
  console.log('Logged in');

  // GOOGLE VIGNETTE KILLER
  setInterval(async () => {
    const url = page.url();
    if (url.includes('#google_vignette')) {
      const clean = url.replace('#google_vignette', '');
      console.log('Vignette detected → cleaning');
      await page.goto(clean, { waitUntil: 'networkidle2' });
      await sleep(2000);
    }
  }, 1000);

  // OPEN SERVER FUNCTION
  async function openServer() {
    console.log('Trying to open server...');
    await safeClick(`a.servercard[data-id="${SERVER_ID}"]`);
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    await sleep(2000);
    console.log('Opened server');
  }

  // open server for first time
  await openServer();

  // MAIN LOOP
  let failedAttempts = 0;

  while (true) {
    let clicked = false;

    // Try restart first
    const restartBtn = await page.$('#restart');
    if (restartBtn) {
      try {
        await safeClick('#restart');
        console.log('Restart found → clicked');
        console.log('waiting 1 hour');
        clicked = true;
        failedAttempts = 0;
        await sleep(3600000);
      } catch {
        console.log('Restart click failed → trying start button');
      }
    }

    // If restart wasn't clicked, try start
    if (!clicked) {
      const startBtn = await page.$('#start');
      if (startBtn) {
        try {
          await safeClick('#start');
          console.log('Start found → clicked');
          console.log('waiting 1 hour');
          clicked = true;
          failedAttempts = 0;
          await sleep(3600000);
        } catch {
          console.log('Start click failed → will retry next loop');
        }
      }
    }

    // If neither worked, increment failedAttempts
    if (!clicked) {
      failedAttempts++;
      console.log('No button yet → waiting', failedAttempts, 'time(s)');

      if (failedAttempts >= 2) {
        console.log('Failed twice → reopening server card');
        await openServer();
        failedAttempts = 0;
      } else {
        await sleep(10000);
      }
    }
  }
})();
