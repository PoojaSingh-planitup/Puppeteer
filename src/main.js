import { Client, Users } from 'node-appwrite';
import puppeteer from 'puppeteer';

// This Appwrite function will be executed every time your function is triggered
export default async ({ req, res, log, error }) => {
  // You can use the Appwrite SDK to interact with other services
  // For this example, we're using the Users service
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(req.headers['x-appwrite-key'] ?? '');
  const users = new Users(client);

  try {
    const response = await users.list();
    // Log messages and errors to the Appwrite Console
    // These logs won't be seen by your end users
    log(`Total users: ${response.total}`);
  } catch(err) {
    error("Could not list users: " + err.message);
  }

  // The req object contains the request data
  if (req.path === "/ping") {
    // Use res object to respond with text(), json(), or binary()
    // Don't forget to return a response!
    return res.text("Pong");
  }


// Puppeteer logic to scrape data from a provided URL
const { url } = JSON.parse(req.payload); // Expecting a JSON payload with a URL
if (!url) {
  return res.json({ error: "No URL provided" }, 400);
}
try {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url); // Use the provided URL
  const title = await page.title(); // Extract the page title
  const images = await page.$$eval('img', imgs => imgs.map(img => img.src)); // Extract image URLs
  const content = await page.content(); // Get the full page content
  log(`Page content captured from ${url}.`);
  await browser.close();
  return res.json({
    title,
    images,
    content,
  });
} catch (err) {
  error("Puppeteer error: " + err.message);
  return res.json({ error: "Failed to scrape the page." }, 500);
}
};

