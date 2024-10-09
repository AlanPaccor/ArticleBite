import axios from 'axios';
import { YoutubeTranscript } from 'youtube-transcript';
import OpenAI from 'openai';

export class YTScraper {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async scrapeAndGenerateQuestions(
    videoUrl: string,
    questionCount: number,
    difficulty: string,
    questionType: string
  ): Promise<string> {
    try {
      // Extract video ID from URL
      const videoId = this.extractVideoId(videoUrl);
      if (!videoId) {
        throw new Error('Invalid YouTube URL');
      }

      // Fetch transcript
      const transcript = await this.getTranscript(videoId);

      // Generate questions using OpenAI
      const questions = await this.generateQuestions(transcript, questionCount, difficulty, questionType);

      return questions;
    } catch (error) {
      console.error('Error in scrapeAndGenerateQuestions:', error);
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

  private async generateQuestions(
    transcript: string,
    questionCount: number,
    difficulty: string,
    questionType: string
  ): Promise<string> {
    const prompt = `
      Based on the following transcript from a YouTube video about algebra, generate ${questionCount} ${difficulty}-level ${questionType} questions:

      ${transcript}

      Format the questions as follows:
      objective1={Question text}
      answer1={Answer or explanation}
      ${questionType === 'multiple choice' ? 'choices1={Option A|Option B|Option C|Option D}\ncorrectAnswer1={Correct option}' : ''}

      objective2={Question text}
      answer2={Answer or explanation}
      ${questionType === 'multiple choice' ? 'choices2={Option A|Option B|Option C|Option D}\ncorrectAnswer2={Correct option}' : ''}

      ... (continue for the specified number of questions)
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000,
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      console.error('Error generating questions:', error);
      throw new Error('Failed to generate questions');
    }
  }
}
