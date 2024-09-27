import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { userAnswer, correctAnswer, question } = req.body;

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are an AI assistant that evaluates essay answers.' },
          { role: 'user', content: `Question: ${question}\nCorrect Answer: ${correctAnswer}\nUser Answer: ${userAnswer}\n\nEvaluate the user's answer. Provide a score out of 10 and a brief summary of the evaluation.` }
        ],
        max_tokens: 150
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const aiResponse = response.data.choices[0].message.content;
    const [scoreStr, summary] = aiResponse.split('\n', 2);
    const score = parseInt(scoreStr.match(/\d+/)[0], 10);

    res.status(200).json({ score, summary });
  } catch (error) {
    console.error('Error checking essay:', error);
    res.status(500).json({ message: 'Error checking essay' });
  }
}