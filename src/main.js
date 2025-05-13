import { Client, Users } from 'node-appwrite';
import puppeteer from 'puppeteer';

export default async ({ req, res, log, error }) => {
  log("Received request to scrape");

  // Set up Appwrite client (not strictly needed for scraping, but fine to keep)
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(req.headers['x-appwrite-key'] ?? '');

  const users = new Users(client);

  if (req.method !== 'POST') {
    return res.json({ error: "Only POST supported" }, 405);
  }

  // Parse incoming JSON payload
  let url;
  try {
    const payload = req.bodyRaw || '{}';
    log("Payload raw: " + payload);
    ({ url } = JSON.parse(payload));
    log("Parsed URL: " + url);
  } catch (e) {
    log("JSON parsing failed: " + e.message);
    return res.json({ error: "Invalid JSON payload" }, 400);
  }

  if (!url) {
    log("No URL provided.");
    return res.json({ error: "No URL provided" }, 400);
  }

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
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
