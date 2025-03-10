// api/scrape.js
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url } = req.body;

  try {
    const browser = await puppeteer.launch({
      args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      defaultViewport: chromium.defaultViewport,
    });

    const page = await browser.newPage();

    // Increase timeout here explicitly:
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 90000 });

    let products = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.clsProd')).map(product => {
        const titleElement = product.querySelector('.clsTitle') || product.querySelector('.clsDetails .prodName');
        return titleElement ? titleElement.textContent.trim() : '';
      }).filter(Boolean);
    });

    products = products.filter(product => product !== "[Name2]");

    await browser.close();
    
    res.status(200).json({ products });
    
  } catch (error) {
    console.error("Error during scraping:", error);
    res.status(500).json({ error: error.message });
  }
}
