import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import * as cheerio from 'cheerio';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { url, email, questionCount, difficulty, questionType } = req.body;

    try {
      const { data } = await axios.get(url);
      const $ = cheerio.load(data);
      const text = $('body').text();

      const summarizedText = await generateQuestions(text, questionCount, difficulty, questionType);

      res.status(200).json({ summarizedText });
    } catch (error) {
      console.error('Error scraping and summarizing:', error);
      res.status(500).json({ error: 'Failed to scrape and summarize data' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

async function generateQuestions(text: string, questionCount: number, difficulty: string, questionType: string) {
  const prompt = `Generate ${questionCount} ${difficulty} ${questionType} questions about algebra from the following text:\n\n${text}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error generating questions:', error);
    throw new Error('Failed to generate questions');
  }
}
