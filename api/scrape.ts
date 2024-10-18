import { VercelRequest, VercelResponse } from '@vercel/node';



import * as puppeteer from 'puppeteer-core';



import chrome from 'chrome-aws-lambda';



import axios from 'axios';







const openaiApiKey = process.env.OPENAI_API_KEY;







if (!openaiApiKey) {



  console.error("OpenAI API key is not set. Please check your environment variables.");



}







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



export async function summarizeText(text: string, questionCount: number, difficulty: string, questionType: string): Promise<string> {



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







    return finalSummaryResponse.data.choices[0].message.content;



  } catch (error: any) {



    console.error('Error summarizing text:', error.response ? error.response.data : error.message);



    throw new Error('OpenAI API request failed');



  }



}







export default async function handler(req: VercelRequest, res: VercelResponse) {



  if (req.method !== 'POST') {



    return res.status(405).json({ error: 'Method Not Allowed' });



  }







  const { url, email, questionCount = 5, difficulty = 'Medium', questionType = 'multiple choice' } = req.body;







  if (!url || !email) {



    return res.status(400).json({ error: 'URL and email are required' });



  }







  try {



    console.log('Launching Puppeteer...');



    const browser = await puppeteer.launch({



      args: chrome.args,



      executablePath: await chrome.executablePath,



      headless: chrome.headless,



    });



    const page = await browser.newPage();







    console.log(`Navigating to URL: ${url}`);



    await page.goto(url, { waitUntil: 'networkidle2' });







    console.log('Extracting text content from the page...');



    const text = await page.evaluate(() => document.body.innerText);







    console.log('Closing browser...');



    await browser.close();







    console.log('Sending the extracted text for summarization...');



    const summarizedText = await summarizeText(text, questionCount, difficulty, questionType);







    console.log('Summarization complete, sending response...');



    res.status(200).json({ summarizedText });



  } catch (error: any) {



    console.error('Error scraping or summarizing data:', error.message);



    res.status(500).json({ error: 'Failed to scrape and summarize data' });



  }



}






