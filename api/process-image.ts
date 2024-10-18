import { VercelRequest, VercelResponse } from '@vercel/node';
import Tesseract from 'tesseract.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { file } = req.body;
    
    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const result = await Tesseract.recognize(file);
    const extractedText = result.data.text;

    res.status(200).json({ extractedText });
  } catch (error: any) {
    console.error('Error processing image:', error.message);
    res.status(500).json({ error: 'Failed to process image' });
  }
}
