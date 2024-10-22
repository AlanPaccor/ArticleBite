import { createWorker } from 'tesseract.js';
import { readFileSync } from 'fs';
import pdf from 'pdf-parse';
import { YoutubeTranscript } from 'youtube-transcript';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function processFile(uploadType: string, file: any, email: string, questionCount: number, difficulty: string, questionType: string) {
  let extractedText = '';

  switch (uploadType) {
    case 'png':
      const worker = await createWorker();
      await worker.loadLanguage('eng');
      await worker.initialize('eng');
      const { data: { text } } = await worker.recognize(readFileSync(file.path));
      await worker.terminate();
      extractedText = text;
      break;
    case 'file':
      if (file.mimetype === 'application/pdf') {
        const dataBuffer = readFileSync(file.path);
        const pdfData = await pdf(dataBuffer);
        extractedText = pdfData.text;
      } else if (file.mimetype === 'text/plain') {
        extractedText = readFileSync(file.path, 'utf-8');
      }
      break;
    case 'mp4':
      // Implement MP4 processing here
      break;
    case 'youtube':
      const videoId = extractVideoId(file.path);
      if (videoId) {
        const transcript = await YoutubeTranscript.fetchTranscript(videoId);
        extractedText = transcript.map(item => item.text).join(' ');
      }
      break;
    case 'url':
      // Implement URL scraping here
      break;
  }

  if (extractedText) {
    const generatedQuestions = await generateQuestions(extractedText, questionCount, difficulty, questionType);
    return { extractedText: generatedQuestions };
  } else {
    throw new Error('Failed to extract text');
  }
}

async function generateQuestions(text: string, questionCount: number, difficulty: string, questionType: string) {
  const prompt = `Generate ${questionCount} ${difficulty} ${questionType} questions about algebra from the following text:\n\n${text}`;

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 1000,
  });

  return response.choices[0].message.content;
}

function extractVideoId(url: string): string | null {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}
