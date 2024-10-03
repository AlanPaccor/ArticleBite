import express, { Request, Response } from 'express';
import multer from 'multer';
import { createWorker } from 'tesseract.js';
import bodyParser from 'body-parser';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Construct the path to the .env file
const envPath = path.resolve(__dirname, '../../.env');
console.log('Loading .env file from:', envPath);

// Load the .env file
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('Error loading .env file:', result.error);
} else {
  console.log('.env file loaded successfully');
}

// Log the API key (be careful with this in production!)

dotenv.config({ path: '../.env' });


const app = express();
app.use(bodyParser.json());
app.use(cors());

const openaiApiKey: string | undefined = process.env.OPENAI_API_KEY;

if (!openaiApiKey) {
  console.error("OpenAI API key is not set. Please check your .env file.");
  process.exit(1);
}

const upload = multer({ storage: multer.memoryStorage() });

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
        model: 'gpt-3.5-turbo',
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

Where n is the question number (1, 2, 3, etc.). Ensure to provide exactly 4 choices for each question. Do not include curly braces in the actual content.`;
    } else if (questionType === 'essay') {
      prompt += `Use the following format for each question:
objective{n}={question}
answer{n}={sample answer or key points}

Where n is the question number (1, 2, 3, etc.). Do not include curly braces in the actual content.`;
    } else {
      prompt += `Use the following format: objective1={objective1}, objective2={objective2}, ..., answer1={answer1}, answer2={answer2}. Provide at least ${questionCount} objectives and answers. Do not include curly braces in the actual content.`;
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

app.post('/extract-text', upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const worker = await createWorker('eng');
    const { data: { text } } = await worker.recognize(req.file.buffer);
    await worker.terminate();

    res.json({ extractedText: text });
  } catch (error) {
    console.error('Error extracting text:', error);
    res.status(500).json({ error: 'Failed to extract text from image' });
  }
});

app.post('/generate-questions', async (req: Request, res: Response) => {
  const { text, questionCount, difficulty, questionType } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  try {
    const generatedQuestions = await summarizeText(text, questionCount, difficulty, questionType);
    res.json({ generatedQuestions });
  } catch (error) {
    console.error('Error generating questions:', error);
    res.status(500).json({ error: 'Failed to generate questions' });
  }
});

app.post('/process-file', upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const uploadType = req.body.uploadType as string;
  let extractedText = '';

  try {
    switch (uploadType) {
      case 'file':
        // Process PDF, DOCX, or TXT file
        // You may need additional libraries to handle these file types
        extractedText = 'File processing not implemented yet';
        break;
      case 'mp4':
        // Process MP4 file
        // You may need a library to extract audio and then transcribe it
        extractedText = 'MP4 processing not implemented yet';
        break;
      case 'youtube':
        // Process YouTube URL
        // You may need to download the video and then extract audio for transcription
        extractedText = 'YouTube processing not implemented yet';
        break;
      default:
        return res.status(400).json({ error: 'Invalid upload type' });
    }

    res.json({ extractedText });
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).json({ error: 'Failed to process file' });
  }
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
