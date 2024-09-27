import puppeteer from 'puppeteer';
import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const app = express();
app.use(bodyParser.json());
app.use(cors());

const openaiApiKey: string | undefined = process.env.OPENAI_API_KEY;

if (!openaiApiKey) {
  console.error("OpenAI API key is not set. Please check your .env file.");
  process.exit(1);
}

// Function to split text into chunks
function splitTextIntoChunks(text: string, maxChunkLength: number = 4000): string[] {
  const chunks: string[] = [];
  let currentChunk = "";

  const sentences = text.split(/(?<=[.!?])\s+/);

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > maxChunkLength) {
      chunks.push(currentChunk.trim());
      currentChunk = "";
    }
    currentChunk += sentence + " ";
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

// Function to summarize text using OpenAI API
async function summarizeText(text: string, questionCount: number, difficulty: string, questionType: string): Promise<string> {
  try {
    console.log('Preparing text for summarization...');
    const chunks = splitTextIntoChunks(text);
    let summaries: string[] = [];

    for (let i = 0; i < chunks.length; i++) {
      console.log(`Summarizing chunk ${i + 1} of ${chunks.length}...`);
      const openaiResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-4',
        messages: [
          { role: "system", content: "You are a helpful assistant that summarizes text into a notecard format." },
          { role: "user", content: `Summarize the following text into key points:\n\n${chunks[i]}` }
        ],
        max_tokens: 500,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      summaries.push(openaiResponse.data.choices[0].message.content);
    }

    const combinedSummary = summaries.join("\n\n");

    console.log('Creating final summary with questions...');
    let prompt = `Create a notecard format with ${questionCount} questions from the following summary. Difficulty: ${difficulty}. Question type: ${questionType}. `;

    if (questionType === 'multiple choice') {
      prompt += `Use the following format for each question:
objective{n}={question}
choices{n}={choice1|choice2|choice3|choice4}
correctAnswer{n}={correct choice}
answer{n}={explanation}

Where n is the question number (1, 2, 3, etc.). Ensure to provide exactly 4 choices for each question.`;
    } else if (questionType === 'essay') {
      prompt += `Use the following format for each question:
objective{n}={question}
answer{n}={sample answer or key points}

Where n is the question number (1, 2, 3, etc.).`;
    } else {
      prompt += `Use the following format: objective1={objective1}, objective2={objective2}, ..., answer1={answer1}, answer2={answer2}. Provide at least ${questionCount} objectives and answers, and don't forget to add the "{}":\n\n${combinedSummary}`;
    }

    prompt += `\n\n${combinedSummary}`;

    const finalSummaryResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4',
      messages: [
        { role: "system", content: "You are a helpful assistant that creates notecards from summaries." },
        { role: "user", content: prompt }
      ],
      max_tokens: 1000,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const finalSummary = finalSummaryResponse.data.choices[0].message.content;
    console.log('Received final response from OpenAI:', finalSummary);
    return finalSummary;
  } catch (error: any) {
    console.error('Error summarizing text:', error.response ? error.response.data : error.message);
    throw new Error('OpenAI API request failed');
  }
}

// Scrape and summarize content from the provided URL
app.post('/scrape', async (req: Request, res: Response) => {
  const { url, email, questionCount = 5, difficulty = 'Medium', questionType = 'multiple choice' } = req.body;

  if (!url || !email) {
    console.log('URL or email is missing from the request.');
    return res.status(400).json({ error: 'URL and email are required' });
  }

  try {
    console.log('Launching Puppeteer...');
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
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
    res.json({ summarizedText });
  } catch (error: any) {
    console.error('Error scraping or summarizing data:', error.message);
    res.status(500).json({ error: 'Failed to scrape and summarize data' });
  }
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});