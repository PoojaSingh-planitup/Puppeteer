import { Client, Users } from 'node-appwrite';
import { chromium } from 'playwright';

export default async ({ req, res, log, error }) => {
  log("📥 Request received: " + req.method + " " + req.path);

  // Appwrite client setup
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
        const payload = req.payload || req.bodyRaw || '{}';
        log('📝 Payload raw: ' + payload);
        ({ url } = JSON.parse(payload));
      } catch (e) {
        return res.json({ error: 'Invalid JSON payload' }, 400);
      }

      if (!url) return res.json({ error: 'No URL provided' }, 400);

      log('🌐 Scraping URL: ' + url);

      // Launch browser
      const browser = await chromium.launch();
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'domcontentloaded' });

      const title = await page.title();
      const images = await page.$$eval('img', imgs => imgs.map(img => img.src));
      const text = await page.$$eval('p', ps => ps.map(p => p.innerText));
      const listItems = await page.$$eval('li', lis => lis.map(li => li.innerText));

      await browser.close();

      return res.json({ title, images, text, listItems });
    }

    return res.json({ error: 'Invalid route' }, 404);
  } catch (err) {
    error('❌ Error: ' + err.message);
    return res.json({ error: 'Internal Server Error' }, 500);
  }
};
