import { Client } from 'node-appwrite';
import chromium from 'chrome-aws-lambda';
import puppeteer from 'puppeteer-core';

export default async ({ req, res, log, error }) => {
  log("Received request to scrape");

  let url;
  try {
    const payload = req.bodyRaw || '{}';
    log("Payload raw: " + payload);
    ({ url } = JSON.parse(payload));
    log("Parsed URL: " + url);
  } catch (e) {
    return res.json({ error: "Invalid JSON payload" }, 400);
  }

  if (!url) {
    return res.json({ error: "No URL provided" }, 400);
  }

  try {
    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    const title = await page.title();
    const images = await page.$$eval('img', imgs => imgs.map(img => img.src));
    const text = await page.$$eval('p', ps => ps.map(p => p.innerText));
    const listItems = await page.$$eval('li', lis => lis.map(li => li.innerText));

    await browser.close();

    return res.json({ title, images, text, listItems });
  } catch (err) {
    error("Puppeteer error: " + err.message);
    return res.json({ error: "Failed to scrape site." }, 500);
  }
};
