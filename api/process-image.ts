import { VercelRequest, VercelResponse } from '@vercel/node';
import { createWorker } from 'tesseract.js';
import { summarizeText } from './scrape';
import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: false,
  },
};

interface ParsedForm {
  fields: formidable.Fields;
  files: formidable.Files;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const form = new formidable.IncomingForm();
    
    const { fields, files } = await new Promise<ParsedForm>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve({ fields, files });
      });
    });

    const file = files.file as formidable.File;
    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const worker = await createWorker();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');

    await worker.setParameters({
      tessedit_ocr_engine_mode: 3,
    });

    const { data: { text } } = await worker.recognize(file.filepath);
    await worker.terminate();

    const email = fields.email as string;
    const questionCount = parseInt(fields.questionCount as string, 10);
    const difficulty = fields.difficulty as string;
    const questionType = fields.questionType as string;

    const summarizedText = await summarizeText(text, questionCount, difficulty, questionType);

    res.status(200).json({ summarizedText });

  } catch (error: any) {
    console.error('Error processing image:', error.message);
    res.status(500).json({ error: 'Failed to process image' });
  }
}
