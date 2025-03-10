// app.js
import express from 'express';
import puppeteer from 'puppeteer';
import dotenv from 'dotenv';
import LLM from '@themaximalist/llm.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());

// Scraping function
async function scrapeProducts(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });

  let products = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.clsProd')).map(product => {
      const titleElement = product.querySelector('.clsTitle') || product.querySelector('.clsDetails .prodName');
      return titleElement ? titleElement.textContent.trim() : '';
    }).filter(Boolean);
  });

  // filter out the exact string "[Name2]" from the product names
    products = products.filter(product => product !== "[Name2]");

  await browser.close();
  return products;
}

// Generate smart names via LLM
async function generateSmartNames(productList) {
  const renamedProducts = [];
  for (let product of productList) {
    let response = await llm.chat(product);
    // clean up the response - remove any extra spaces or new lines and the words json 
    response = response.replace(/\s+/g, ' ').trim();
    response = response.replace(/json/gi, '');
    // parse the response to JSON
    renamedProducts.push(JSON.parse(response));
  }
  return renamedProducts;
}

async function generateSmartName(product, model, system_prompt) {
    
        // Initialize LLM with OpenAI GPT-4 model
        const llm = new LLM([], { model });

        if (system_prompt) {
            llm.system(system_prompt);
        }
        else {
            // Set system prompt
            llm.system(`You are an expert at simplifying Indian product names without losing brand identity. Given a product name, return a JSON object with three keys:
            - "name": simplified, catchy, and clear product name.
            - "category": relevant sub-category of the product.
            - "type": relevant meal type (e.g., breakfast, meal, snack, dessert, starter, main course, side dish, beverage, appetizer, salad, soup, sauce, dip, dressing).
            - "shopping_guide": Shopping guides using LLMs to attract non Indian audiences. Do not exaggerate or sell. Just provide a simple guide to help them understand the product.
    
            Respond strictly in JSON format with no additional text or markdown.`);
        }

      let response = await llm.chat(product);
      // clean up the response - remove any extra spaces or new lines and the words json 
      response = response.replace(/\s+/g, ' ').trim();
      response = response.replace(/json/gi, '');
      response = response.replace(/^\{/, '{\n');
      response = response.replace(/\}/, '\n}');
      response = response.replace(/`/g, '');
      // parse the response to JSON
    return JSON.parse(response);
  }

// API endpoint to handle scraping and renaming
app.post('/api/scrape', async (req, res) => {
  try {
    const { url } = req.body;
    const scrapedProducts = await scrapeProducts(url);
    res.json({ products: scrapedProducts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// API endpoint to handle renaming
app.post('/api/rename', async (req, res) => {
  try {
    const { product, model, system_prompt } = req.body;
    const renamed = await generateSmartName(product, model, system_prompt);
    res.json({ original: product, renamed });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
