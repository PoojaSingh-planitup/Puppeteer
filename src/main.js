import { Client, Users } from 'node-appwrite';
import puppeteer from 'puppeteer';

export default async ({ req, res, log, error }) => {
  log("Received request to " + req.path);

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(req.headers['x-appwrite-key'] ?? '');

  const users = new Users(client);

  try {
    if (req.method === 'GET' && req.path === '/ping') {
      return res.text('pong');
    }

    if (req.method === 'POST' && req.path === '/scrape') {
      let url;
      try {
        const payload = req.payload || '{}';
        log("Payload raw: " + payload);
        ({ url } = JSON.parse(payload));
      } catch (e) {
        return res.json({ error: "Invalid JSON payload" }, 400);
      }

      if (!url) return res.json({ error: "No URL provided" }, 400);
      log("Parsed URL: " + url);

      const browser = await puppeteer.launch({
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'domcontentloaded' });

      const title = await page.title();
      const images = await page.$$eval('img', imgs => imgs.map(i => i.src));
      const text = await page.$$eval('p', ps => ps.map(p => p.innerText));
      const listItems = await page.$$eval('li', lis => lis.map(li => li.innerText));

      await browser.close();

      return res.json({ title, images, text, listItems });
    }

    return res.json({ error: "Invalid route" }, 404);
  } catch (err) {
    error("Puppeteer error: " + err.message);
    return res.json({ error: "Internal Server Error" }, 500);
  }
};
