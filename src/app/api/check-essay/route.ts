import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  const { answers, notecards } = await req.json();

  const scores: { [key: number]: number } = {};

  for (const [index, notecard] of notecards.entries()) {
    const userAnswer = answers[index] || '';
    const correctAnswer = notecard.explanation;

    const prompt = `
      Question: ${notecard.objective}
      Correct Answer: ${correctAnswer}
      User's Answer: ${userAnswer}

      Please evaluate the user's answer based on the correct answer and provide a score out of 10. 
      Consider factors such as accuracy, completeness, and clarity. 
      Only respond with a number between 0 and 10, with no additional text.
    `;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 5,
      });

      const score = parseFloat(response.choices[0].message.content || '0');
      scores[index] = Math.min(Math.max(score, 0), 10); // Ensure score is between 0 and 10
    } catch (error) {
      console.error('Error evaluating essay:', error);
      scores[index] = 0; // Default to 0 if there's an error
    }
  }

  return NextResponse.json({ scores });
}