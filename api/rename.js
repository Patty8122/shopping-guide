import dotenv from 'dotenv';
import LLM from '@themaximalist/llm.js';

dotenv.config();

async function generateSmartName(product, model, system_prompt) {
  const llm = new LLM([], { model });

  if (system_prompt) {
    llm.system(system_prompt);
  } else {
    llm.system(`You are an expert at simplifying Indian product names without losing brand identity. Given a product name, return a JSON object with four keys:
- "name": clear product name with brand and product type
- "category": relevant sub-category of the product.
- "type": relevant meal type (e.g., breakfast, meal, snack, dessert, starter, main course, side dish, beverage, appetizer, salad, soup, sauce, dip, dressing).
- "shopping_guide": Provide a simple guide to help non-Indian audiences understand the product.

Respond strictly in JSON format with no additional text or markdown.`);
  }

  let response = await llm.chat(product);
  response = response.replace(/\s+/g, ' ').trim().replace(/json/gi, '').replace(/`/g, '');
  
  return JSON.parse(response);
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { product, model, system_prompt } = req.body;
      const renamed = await generateSmartName(product, model, system_prompt);
      res.status(200).json({ original: product, renamed });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
} else {
    res.status(405).json({ error: "Method not allowed" });
}
}
