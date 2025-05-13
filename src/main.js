import puppeteer from 'puppeteer';

export default async ({ req, res, log, error }) => {
  try {
    log("=== Universal Scraper Function ===");
    log("Method: " + req.method);
    log("Payload: " + req.payload);

    // Try to extract URL from any payload
    let url = null;
    try {
      const payload = JSON.parse(req.payload || '{}');
      url = payload.url;
    } catch (parseErr) {
      error("Payload parse error: " + parseErr.message);
    }

    if (url) {
      log("Scraping URL: " + url);

      const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'domcontentloaded' });

      const title = await page.title();
      const images = await page.$$eval('img', imgs => imgs.map(i => i.src));
      const text = await page.$$eval('p', ps => ps.map(p => p.innerText));
      const listItems = await page.$$eval('li', lis => lis.map(li => li.innerText));

      log("Title: " + title);
      images.forEach((src, i) => log(`Image[${i}]: ${src}`));
      text.forEach((p, i) => log(`Paragraph[${i}]: ${p}`));
      listItems.forEach((li, i) => log(`ListItem[${i}]: ${li}`));

      await browser.close();

      return res.json({ title, images, text, listItems });
    }

    log("No URL provided. Skipping scraping.");
    return res.json({ message: "No URL provided in payload." }, 200);
  } catch (err) {
    error("Unhandled error: " + err.message);
    return res.json({ error: "Internal Server Error", message: err.message }, 500);
  }
};
