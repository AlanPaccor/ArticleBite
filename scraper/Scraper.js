const puppeteer = require('puppeteer');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());
app.use(cors());

// OpenAI API configuration
console.log("API Key:", process.env.OPENAI_API_KEY ? "Successfully loaded" : "Not found");

const openaiApiKey = process.env.OPENAI_API_KEY;

if (!openaiApiKey) {
  console.error("OpenAI API key is not set. Please check your .env file.");
  process.exit(1);
}

async function summarizeText(text) {
  try {
    console.log('Sending text to OpenAI API for summarization...');
    const openaiResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4',
      messages: [
        {role: "system", content: "You are a helpful assistant that summarizes text into a notecard format."},
        {role: "user", content: `Summarize the following text into a notecard format. Use the following format: objective1={objective1}, objective2={objective2}, ..., answer1={answer1}, answer2={answer2}, .... Provide at least 3 objectives and answers don't forget to add the "{}":\n\n${text}`}
      ],
      max_tokens: 500,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Received response from OpenAI:', openaiResponse.data.choices[0].message.content);
    return openaiResponse.data.choices[0].message.content;
  } catch (error) {
    console.error('Error summarizing text:', error.response ? error.response.data : error.message);
    throw new Error('OpenAI API request failed');
  }
}


app.post('/scrape', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    console.log('URL is missing from the request.');
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    console.log('Launching Puppeteer...');
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    console.log(`Navigating to URL: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2' });

    console.log('Extracting text content from the page...');
    const text = await page.evaluate(() => document.body.innerText);

    console.log('Closing browser...');
    await browser.close();

    console.log('Sending the extracted text to OpenAI for summarization...');
    const summarizedText = await summarizeText(text);

    console.log('Summarization complete, sending response...');
    res.json({ summarizedText });
  } catch (error) {
    console.error('Error scraping or summarizing data:', error.message);
    res.status(500).json({ error: 'Failed to scrape and summarize data' });
  }
});

app.listen(3001, () => {
  console.log('Server running on port 3001');
});