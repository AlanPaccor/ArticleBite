import { VercelRequest, VercelResponse } from '@vercel/node';
import * as puppeteer from 'puppeteer-core';
import chrome from 'chrome-aws-lambda';
import axios from 'axios';

const openaiApiKey = process.env.OPENAI_API_KEY;

if (!openaiApiKey) {
  console.error("OpenAI API key is not set. Please check your environment variables.");
}

// Function to split text into chunks
function splitTextIntoChunks(text: string, maxChunkLength: number = 4000): string[] {
  // ... (keep the existing implementation)
}

// Function to summarize text using OpenAI API
async function summarizeText(text: string, questionCount: number, difficulty: string, questionType: string): Promise<string> {
  // ... (keep the existing implementation)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { url, email, questionCount = 5, difficulty = 'Medium', questionType = 'multiple choice' } = req.body;

  if (!url || !email) {
    return res.status(400).json({ error: 'URL and email are required' });
  }

  try {
    console.log('Launching Puppeteer...');
    const browser = await puppeteer.launch({
      args: chrome.args,
      executablePath: await chrome.executablePath,
      headless: chrome.headless,
    });
    const page = await browser.newPage();

    console.log(`Navigating to URL: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2' });

    console.log('Extracting text content from the page...');
    const text = await page.evaluate(() => document.body.innerText);

    console.log('Closing browser...');
    await browser.close();

    console.log('Sending the extracted text for summarization...');
    const summarizedText = await summarizeText(text, questionCount, difficulty, questionType);

    console.log('Summarization complete, sending response...');
    res.status(200).json({ summarizedText });
  } catch (error: any) {
    console.error('Error scraping or summarizing data:', error.message);
    res.status(500).json({ error: 'Failed to scrape and summarize data' });
  }
}
