import { VercelRequest, VercelResponse } from '@vercel/node';



import formidable from 'formidable';



import { createWorker } from 'tesseract.js';



import fs from 'fs';



import { summarizeText } from './scrape'; // This import should now work correctly







export const config = {



  api: {



    bodyParser: false,



  },



};







export default async function handler(req: VercelRequest, res: VercelResponse) {



  if (req.method !== 'POST') {



    return res.status(405).json({ error: 'Method Not Allowed' });



  }







  const form = new formidable.IncomingForm();



  form.parse(req, async (err, fields, files) => {



    if (err) {



      return res.status(500).json({ error: 'Error parsing form data' });



    }







    const file = files.file as formidable.File;



    if (!file) {



      return res.status(400).json({ error: 'No file provided' });



    }







    try {



      const worker = await createWorker({
        logger: m => console.log(m)
      });
      await worker.loadLanguage('eng');
      await worker.initialize('eng');
      const { data: { text } } = await worker.recognize(file.filepath);
      await worker.terminate();







      // Extract other fields



      const email = fields.email as string;



      const questionCount = parseInt(fields.questionCount as string, 10);



      const difficulty = fields.difficulty as string;



      const questionType = fields.questionType as string;







      // Summarize the extracted text



      const summarizedText = await summarizeText(text, questionCount, difficulty, questionType);







      res.status(200).json({ summarizedText });



    } catch (error: any) {



      console.error('Error processing image:', error.message);



      res.status(500).json({ error: 'Failed to process image' });



    } finally {



      // Clean up the temporary file



      fs.unlinkSync(file.filepath);



    }



  });



}








