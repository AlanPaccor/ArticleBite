import express, { Request, Response } from 'express';
import multer from 'multer';
import { createWorker } from 'tesseract.js';
import bodyParser from 'body-parser';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { YoutubeTranscript } from 'youtube-transcript';
import OpenAI from 'openai';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Readable } from 'stream';
import { execFile, exec } from 'child_process';
import Ffmpeg from 'fluent-ffmpeg';
import pdf from 'pdf-parse/lib/pdf-parse';
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

// Add this line at the top of the file, after other imports
const puppeteer = require('puppeteer');

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
    if (!text || text.trim().length === 0) {
      throw new Error('The provided text is empty or insufficient for generating questions.');
    }

    console.log('Text length:', text.length);
    console.log('First 100 characters:', text.slice(0, 100));

    const chunks = splitTextIntoChunks(text);
    console.log('Number of chunks:', chunks.length);

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
    console.log('Combined summary length:', combinedSummary.length);

    if (combinedSummary.trim().length === 0) {
      throw new Error('The summarized text is empty or insufficient for generating questions.');
    }

    console.log('Creating final summary with questions...');
    let prompt = `Create a notecard format with exactly ${questionCount} questions from the following summary, and then add one extra empty question. Difficulty: ${difficulty}. Question type: ${questionType}. `;

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
      prompt += `Use the following format:
objective{n}={question}
answer{n}={answer or explanation}

Where n is the question number (1, 2, 3, etc.). Provide exactly ${questionCount} objectives and answers. Do not include curly braces in the actual content.`;
    }

    prompt += `\n\nEnsure that you generate exactly ${questionCount} questions, no more and no less. After generating these questions, add one extra question with the following format:
objective${questionCount + 1}=empty
answer${questionCount + 1}=empty

\n\n${combinedSummary}`;

    let finalSummary = '';
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
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

      finalSummary = finalSummaryResponse.data.choices[0].message.content;
      console.log('Received final response from OpenAI:', finalSummary);

      // Count the number of questions generated
      const questionMatches = finalSummary.match(/objective\d+=/g);
      const generatedQuestionCount = questionMatches ? questionMatches.length : 0;

      if (generatedQuestionCount === questionCount + 1) {
        break;
      } else {
        console.log(`Generated ${generatedQuestionCount} questions instead of ${questionCount + 1}. Retrying...`);
        attempts++;
      }
    }

    if (attempts === maxAttempts) {
      throw new Error(`Failed to generate exactly ${questionCount + 1} questions after ${maxAttempts} attempts. The content might be insufficient or not suitable for the requested number of questions.`);
    }

    return finalSummary;
  } catch (error: any) {
    console.error('Error summarizing text:', error.response ? error.response.data : error.message);
    throw new Error(error.message || 'OpenAI API request failed');
  }
}

// Add the YTScraper class definition here
class YTScraper {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async scrapeAndCheckContent(videoUrl: string): Promise<string> {
    try {
      const videoId = this.extractVideoId(videoUrl);
      if (!videoId) {
        throw new Error('Invalid YouTube URL');
      }

      const transcript = await this.getTranscript(videoId);
      console.log('Transcript length:', transcript.length);
      console.log('First 200 characters of transcript:', transcript.slice(0, 200));

      const isAlgebraRelated = await this.checkIfAlgebraRelated(transcript);

      if (!isAlgebraRelated) {
        return "The video content does not match the algebra criteria. Please provide a video related to algebra.";
      }

      return transcript;
    } catch (error) {
      console.error('Error in scrapeAndCheckContent:', error);
      throw error;
    }
  }

  private extractVideoId(url: string): string | null {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  private async getTranscript(videoId: string): Promise<string> {
    try {
      const transcriptArray = await YoutubeTranscript.fetchTranscript(videoId);
      return transcriptArray.map(item => item.text).join(' ');
    } catch (error) {
      console.error('Error fetching transcript:', error);
      throw new Error('Failed to fetch video transcript');
    }
  }

  private async checkIfAlgebraRelated(transcript: string): Promise<boolean> {
    const prompt = `
      Analyze the following transcript and determine if it is primarily about algebra. 
      Respond with only "yes" if it is about algebra, or "no" if it is not.

      Transcript:
      ${transcript.slice(0, 1000)} // Using first 1000 characters to save tokens
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 5,
        temperature: 0.3,
      });

      const answer = response.choices[0].message.content?.toLowerCase().trim();
      console.log('Is algebra related:', answer);
      return answer === 'yes';
    } catch (error) {
      console.error('Error checking if content is algebra-related:', error);
      throw new Error('Failed to determine if content is algebra-related');
    }
  }
}

// Add this new class for MP4 processing
class MP4Processor {
  private openai: OpenAI;
  private ffmpegPath: string;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
    this.ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';
    console.log('FFmpeg path:', this.ffmpegPath);
  }

  async processMP4(file: Express.Multer.File): Promise<string> {
    try {
      const audioFile = await this.extractAudioFromMP4(file);
      const transcript = await this.transcribeAudio(audioFile);
      fs.unlinkSync(audioFile); // Clean up the temporary audio file
      return transcript;
    } catch (error) {
      console.error('Error processing MP4:', error);
      throw error;
    }
  }

  private async extractAudioFromMP4(file: Express.Multer.File): Promise<string> {
    return new Promise((resolve, reject) => {
      const outputFile = path.join(__dirname, `temp_${uuidv4()}.mp3`);
      console.log('Output file path:', outputFile);
      console.log('FFmpeg path:', this.ffmpegPath);

      const inputFile = path.join(__dirname, `temp_input_${uuidv4()}.mp4`);
      fs.writeFileSync(inputFile, file.buffer);

      const command = `"${this.ffmpegPath}" -i "${inputFile}" -vn -acodec libmp3lame -f mp3 "${outputFile}"`;
      console.log('Executing command:', command);

      exec(command, (error, stdout, stderr) => {
        fs.unlinkSync(inputFile); // Clean up the temporary input file

        if (error) {
          console.error('FFmpeg stderr:', stderr);
          console.error('FFmpeg error:', error);
          reject(error);
        } else {
          console.log('FFmpeg process completed');
          resolve(outputFile);
        }
      });
    });
  }

  private async transcribeAudio(audioFilePath: string): Promise<string> {
    const audioFile = fs.createReadStream(audioFilePath);
    const response = await this.openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
    });
    return response.text;
  }

  setFFmpegPath(path: string) {
    this.ffmpegPath = path;
  }
}

// Add this new function to process PDF files
async function processPDF(file: Express.Multer.File): Promise<string> {
  try {
    console.log('Processing PDF file:', file.originalname);
    console.log('File buffer length:', file.buffer.length);
    
    const dataBuffer = file.buffer;
    const data = await pdf(dataBuffer, {
      max: 0, // No page limit
      version: 'default'
    });
    
    console.log('PDF processed successfully. Extracted text length:', data.text.length);
    return data.text;
  } catch (error: any) {
    console.error('Error processing PDF:', error);
    throw new Error(`Failed to process PDF file: ${error.message}`);
  }
}

// Add this new function to scrape content from a URL
async function scrapeUrl(url: string): Promise<string> {
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

    return text;
  } catch (error) {
    console.error('Error scraping URL:', error);
    throw new Error('Failed to scrape content from the provided URL');
  }
}

app.post('/extract-text', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  try {
    console.log('Received file:', req.file.originalname);
    console.log('File mimetype:', req.file.mimetype);
    console.log('File size:', req.file.size);

    const worker = await createWorker('eng');
    const { data: { text } } = await worker.recognize(req.file.buffer);
    await worker.terminate();

    console.log('Extracted text:', text);
    res.json({ extractedText: text });
  } catch (error) {
    console.error('Error extracting text:', error);
    res.status(500).json({ error: 'Failed to extract text from image' });
  }
});

app.post('/generate-questions', async (req: Request, res: Response): Promise<void> => {
  const { text, questionCount, difficulty, questionType } = req.body;

  if (!text) {
    res.status(400).json({ error: 'Text is required' });
    return;
  }

  try {
    const generatedQuestions = await summarizeText(text, questionCount, difficulty, questionType);
    res.json({ generatedQuestions });
  } catch (error: any) {
    console.error('Error generating questions:', error);
    res.status(400).json({ error: error.message || 'Failed to generate questions' });
  }
});

app.post('/process-file', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  const uploadType = req.body.uploadType as string;
  let extractedText = '';

  try {
    console.log('Received file:', req.file ? req.file.originalname : 'No file');
    console.log('Upload type:', uploadType);

    if (req.file) {
      console.log('File mimetype:', req.file.mimetype);
      console.log('File size:', req.file.size);
    }

    switch (uploadType) {
      case 'png':
        if (!req.file) {
          res.status(400).json({ error: 'No file uploaded' });
          return;
        }
        console.log('Processing PNG file...');
        try {
          const worker = await createWorker('eng');
          const { data: { text } } = await worker.recognize(req.file.buffer);
          await worker.terminate();
          extractedText = text;
          console.log('Extracted text from PNG:', extractedText);
        } catch (ocrError: any) {
          console.error('OCR processing error:', ocrError);
          res.status(400).json({ error: `OCR processing failed: ${ocrError.message}` });
          return;
        }
        break;
      case 'file':
        if (!req.file) {
          res.status(400).json({ error: 'No file uploaded' });
          return;
        }
        console.log('File mimetype:', req.file.mimetype);
        if (req.file.mimetype === 'application/pdf') {
          try {
            extractedText = await processPDF(req.file);
          } catch (pdfError: any) {
            console.error('PDF processing error:', pdfError);
            res.status(400).json({ error: `PDF processing failed: ${pdfError.message}` });
            return;
          }
        } else if (req.file.mimetype === 'text/plain') {
          extractedText = req.file.buffer.toString('utf-8');
        } else {
          res.status(400).json({ error: 'Unsupported file type. Please upload a PDF or text file.' });
          return;
        }
        break;
      case 'mp4':
        if (!req.file) {
          res.status(400).json({ error: 'No file uploaded' });
          return;
        }
        const ffmpegPath = process.env.FFMPEG_PATH || 'C:\\ffmpeg\\ffmpeg.exe';
        console.log('FFmpeg path in route:', ffmpegPath);
        const mp4Processor = new MP4Processor(openaiApiKey);
        mp4Processor.setFFmpegPath(ffmpegPath);
        try {
          extractedText = await mp4Processor.processMP4(req.file);
        } catch (error: any) {
          console.error('Error in MP4 processing:', error);
          res.status(400).json({ error: error.message, details: error.stack });
          return;
        }
        break;
      case 'youtube':
        if (!req.body.url) {
          res.status(400).json({ error: 'YouTube URL is required' });
          return;
        }
        const ytScraper = new YTScraper(openaiApiKey);
        try {
          extractedText = await ytScraper.scrapeAndCheckContent(req.body.url);
          if (extractedText.startsWith("The video content does not match")) {
            res.status(400).json({ error: extractedText });
            return;
          }
        } catch (error: any) {
          console.error('Error in YouTube processing:', error);
          res.status(400).json({ error: error.message });
          return;
        }
        break;
      case 'url':
        if (!req.body.url) {
          res.status(400).json({ error: 'URL is required' });
          return;
        }
        try {
          extractedText = await scrapeUrl(req.body.url);
        } catch (error: any) {
          console.error('Error in URL scraping:', error);
          res.status(400).json({ error: error.message });
          return;
        }
        break;
      default:
        res.status(400).json({ error: 'Invalid upload type' });
        return;
    }

    if (!extractedText || extractedText.trim().length === 0) {
      res.status(400).json({ error: 'Failed to extract text from the provided source' });
      return;
    }

    console.log('Generating questions from extracted text...');
    // Generate questions using the summarizeText function
    const generatedQuestions = await summarizeText(
      extractedText,
      parseInt(req.body.questionCount),
      req.body.difficulty,
      req.body.questionType
    );
    console.log('Generated questions:', generatedQuestions);

    res.json({ extractedText: generatedQuestions });
  } catch (error: any) {
    console.error('Error processing file:', error);
    res.status(500).json({ error: 'Failed to process file', details: error.message, stack: error.stack });
  }
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});