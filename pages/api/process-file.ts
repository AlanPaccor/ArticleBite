import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import { processFile } from '../../utils/fileProcessing';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
      if (err) {
        res.status(500).json({ error: 'Error parsing form data' });
        return;
      }

      const uploadType = fields.uploadType as string;
      const file = files.file as formidable.File;
      const email = fields.email as string;
      const questionCount = parseInt(fields.questionCount as string);
      const difficulty = fields.difficulty as string;
      const questionType = fields.questionType as string;

      try {
        const fileBuffer = await fs.promises.readFile(file.filepath);
        const result = await processFile(uploadType, { ...file, buffer: fileBuffer }, email, questionCount, difficulty, questionType);
        res.status(200).json(result);
      } catch (error) {
        console.error('Error processing file:', error);
        res.status(500).json({ error: 'Error processing file' });
      } finally {
        if (file.filepath) {
          fs.unlink(file.filepath, (err) => {
            if (err) console.error('Error deleting temp file:', err);
          });
        }
      }
    });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
