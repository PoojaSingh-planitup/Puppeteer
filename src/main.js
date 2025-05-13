import { Client, Users } from 'node-appwrite';
import puppeteer from 'puppeteer';

// This Appwrite function will be executed every time your function is triggered
export default async ({ req, res, log, error }) => {
  // Set up Appwrite Client
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(req.headers['x-appwrite-key'] ?? '');
  const users = new Users(client);

  // Handle the request based on method and path
  try {
    if (req.method === 'GET' && req.path === "/ping") {
      return res.text("Pong");
    }

    if (req.method === 'GET' && req.path === "/users") {
      const response = await users.list();
      log(`Total users: ${response.total}`);
      return res.json(response);
    }

    // Handle scraping logic
    if (req.method === 'POST' && req.path === "/scrape") {
      log("Received request to /scrape");
      log("Payload raw: " + req.payload);
    
      let url;
      try {
        const payload = req.payload || '{}';
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
        await page.goto(url);
    
        const title = await page.title();
        const images = await page.$$eval('img', imgs => imgs.map(img => img.src));
        const text = await page.$$eval('p', ps => ps.map(p => p.innerText));
        const listItems = await page.$$eval('li', lis => lis.map(li => li.innerText));
    
        await browser.close();
    
        log("Scraping complete.");
        return res.json({ title, images, text, listItems });
      } catch (err) {
        log("Puppeteer error: " + err.message);
        return res.json({ error: "Failed to scrape site." }, 500);
      }
    }
    

    // If no valid route is matched
    return res.json({ error: "Invalid route" }, 404);
  } catch (err) {
    error("An error occurred: " + err.message);
    return res.json({ error: "Internal Server Error" }, 500);
  }
};
