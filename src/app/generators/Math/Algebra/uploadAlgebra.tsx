"use client";

import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { User } from 'firebase/auth';
import { auth, db } from '../../../lib/firebase-config';
import { collection, addDoc } from 'firebase/firestore';
import { TiChevronLeftOutline, TiChevronRightOutline } from 'react-icons/ti';
import { Loader, Link, File, Video, Image, Youtube } from 'lucide-react';
import OpenAI from 'openai';
import styles from './UploadPage.css'; // Make sure this CSS file exists
import Tesseract from 'tesseract.js';
import { MathJaxContext, MathJax } from 'better-react-mathjax';

type UploadType = 'url' | 'file' | 'mp4' | 'youtube' | 'png';

interface Notecard {
  objective: string;
  explanation: string;
  choices?: string[];
  correctAnswer?: string;
}

const Card = ({ objective, explanation, isFlipped, onClick }: { objective: string; explanation: string; isFlipped: boolean; onClick: () => void }) => (
  <div
    className={`card w-80 h-96 bg-blue-200 rounded-lg shadow-lg text-gray-800 cursor-pointer transition-transform duration-500 transform ${isFlipped ? 'rotate-y-180' : ''}`}
    onClick={onClick}
    style={{
      perspective: '1000px',
      transformStyle: 'preserve-3d',
    }}
  >
    {/* Front Side (Question) */}
    <div className={`backface-hidden transition-opacity duration-500 ${isFlipped ? 'opacity-0' : 'opacity-100'}`}>
      <div className="text-center px-4">
        <h2 className="text-xl font-bold mb-4">Question</h2>
        <p className="text-lg">{objective}</p>
      </div>
    </div>
    
    {/* Back Side (Answer) */}
    <div className={`backface-hidden rotate-y-180 transition-opacity duration-500 ${isFlipped ? 'opacity-100' : 'opacity-0'}`}>
      <div className="text-center px-4">
        <h2 className="text-xl font-bold mb-4">Answer</h2>
        <p className="text-lg">{explanation}</p>
      </div>
    </div>
  </div>
);

const Carousel = ({ children }: { children: React.ReactNode }) => {
  const [active, setActive] = useState(0);
  const count = React.Children.count(children);
  const MAX_VISIBILITY = 3;

  return (
    <div className="carousel relative w-full h-96 perspective-500 transform-style-preserve-3d flex justify-center items-center">
      {active > 0 && (
        <button className="nav left absolute top-1/2 left-0 transform -translate-y-1/2 text-5xl text-blue-500 z-10 cursor-pointer" onClick={() => setActive(i => i - 1)}>
          <TiChevronLeftOutline />
        </button>
      )}
      {React.Children.map(children, (child, i) => (
        <div
          className="card-container absolute w-80 h-96 transition-all duration-300 ease-out"
          style={{
            '--active': i === active ? 1 : 0,
            '--offset': (active - i) / 3,
            '--direction': Math.sign(active - i),
            '--abs-offset': Math.abs(active - i) / 3,
            pointerEvents: active === i ? 'auto' : 'none',
            opacity: Math.abs(active - i) >= MAX_VISIBILITY ? 0 : 1,
            display: Math.abs(active - i) > MAX_VISIBILITY ? 'none' : 'block',
            transform: `
              rotateY(calc(var(--offset) * 50deg)) 
              scaleY(calc(1 + var(--abs-offset) * -0.4))
              translateZ(calc(var(--abs-offset) * -30rem))
              translateX(calc(var(--direction) * -5rem))
            `,
            filter: `blur(calc(var(--abs-offset) * 1rem))`,
          } as React.CSSProperties}
        >
          {child}
        </div>
      ))}
      {active < count - 1 && (
        <button className="nav right absolute top-1/2 right-0 transform -translate-y-1/2 text-5xl text-blue-500 z-10 cursor-pointer" onClick={() => setActive(i => i + 1)}>
          <TiChevronRightOutline />
        </button>
      )}
    </div>
  );
};

const CarouselView = ({ notecards }: { notecards: Notecard[] }) => {
  const [flippedCards, setFlippedCards] = useState<number[]>([]);

  const handleCardFlip = (index: number) => {
    setFlippedCards((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-center mb-4">Carousel View</h2>
      <Carousel>
        {notecards.map((card, index) => (
          <Card
            key={index}
            objective={card.objective}
            explanation={card.explanation}
            isFlipped={flippedCards.includes(index)}
            onClick={() => handleCardFlip(index)}
          />
        ))}
      </Carousel>
    </div>
  );
};

interface MultipleChoiceQuestion extends Notecard {
  choices: string[];
  correctAnswer: string;
}

const MultipleChoiceView = ({ notecards }: { notecards: Notecard[] }) => {
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: string }>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  const handleAnswerSelect = (questionIndex: number, answer: string) => {
    setSelectedAnswers(prev => ({ ...prev, [questionIndex]: answer }));
  };

  const checkAnswers = () => {
    let correctCount = 0;
    notecards.forEach((question, index) => {
      if (selectedAnswers[index] === question.correctAnswer) {
        correctCount++;
      }
    });
    setScore(correctCount);
    setShowResults(true);
  };

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-bold text-center mb-4">Multiple Choice Questions</h2>
      <div className="w-full max-w-4xl">
        {notecards.map((question, questionIndex) => (
          <div key={questionIndex} className="mb-8 flex">
            <div className="w-1/2 pr-4">
              <h3 className="text-lg font-semibold mb-2">Question {questionIndex + 1}:</h3>
              <p>{question.objective}</p>
            </div>
            <div className="w-1/2">
              {question.choices ? (
                question.choices.map((choice, choiceIndex) => (
                  <div key={choiceIndex} className="mb-2">
                    <label className={`flex items-center p-2 rounded ${
                      showResults
                        ? selectedAnswers[questionIndex] === choice
                          ? choice === question.correctAnswer
                            ? 'bg-green-200'
                            : 'bg-red-200'
                          : choice === question.correctAnswer
                            ? 'bg-green-200'
                            : ''
                        : 'hover:bg-gray-100'
                    }`}>
                      <input
                        type="radio"
                        name={`question-${questionIndex}`}
                        value={choice}
                        checked={selectedAnswers[questionIndex] === choice}
                        onChange={() => handleAnswerSelect(questionIndex, choice)}
                        disabled={showResults}
                        className="mr-2"
                      />
                      {String.fromCharCode(65 + choiceIndex)}. {choice}
                    </label>
                  </div>
                ))
              ) : (
                <p>No choices available for this question.</p>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center">
        <button
          onClick={checkAnswers}
          disabled={showResults}
          className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition"
        >
          Check Answers
        </button>
        {showResults && (
          <p className="ml-4 text-lg font-semibold">
            Score: {score} / {notecards.length}
          </p>
        )}
      </div>
    </div>
  );
};

const EssayView = ({ notecards }: { notecards: Notecard[] }) => {
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [scores, setScores] = useState<{ [key: number]: number }>({});
  const [isChecking, setIsChecking] = useState(false);

  const handleAnswerChange = (questionIndex: number, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionIndex]: answer }));
  };

  const checkAnswers = async () => {
    setIsChecking(true);
    const openai = new OpenAI({
      apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true // Note: This is not recommended for production
    });

    const newScores: { [key: number]: number } = {};

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
        newScores[index] = Math.min(Math.max(score, 0), 10); // Ensure score is between 0 and 10
      } catch (error) {
        console.error('Error evaluating essay:', error);
        newScores[index] = 0; // Default to 0 if there's an error
      }
    }

    setScores(newScores);
    setIsChecking(false);
  };

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-bold text-center mb-4">Essay Questions</h2>
      <div className="w-full max-w-4xl">
        {notecards.map((question, questionIndex) => (
          <div key={questionIndex} className="mb-8">
            <h3 className="text-lg font-semibold mb-2">Question {questionIndex + 1}:</h3>
            <p className="mb-2">{question.objective}</p>
            <textarea
              className="w-full p-2 border border-gray-300 rounded"
              rows={6}
              value={answers[questionIndex] || ''}
              onChange={(e) => handleAnswerChange(questionIndex, e.target.value)}
              placeholder="Type your answer here..."
            />
            {scores[questionIndex] !== undefined && (
              <p className="mt-2 font-semibold">
                Score: {scores[questionIndex].toFixed(2)} / 10
              </p>
            )}
          </div>
        ))}
      </div>
      <button
        className="mt-4 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition"
        onClick={checkAnswers}
        disabled={isChecking}
      >
        {isChecking ? 'Checking...' : 'Check Answers'}
      </button>
    </div>
  );
};

const UploadAlgebra: React.FC = () => {
  const [uploadType, setUploadType] = useState<UploadType>('url');
  const [input, setInput] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [notecards, setNotecards] = useState<Notecard[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [user, setUser] = useState<User | null>(null);
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<string>('Easy');
  const [selectedQuestionType, setSelectedQuestionType] = useState<string>('true/false');
  const [logs, setLogs] = useState<string[]>([]);
  const [extractedText, setExtractedText] = useState<string>('');
  const [showResults, setShowResults] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        router.push('/registration/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleUploadTypeChange = (type: UploadType) => {
    setUploadType(type);
    setInput('');
    setFile(null);
    setError('');
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setInput(event.target.value);
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setFile(file);
      
      if (uploadType === 'png') {
        setIsLoading(true);
        try {
          const formData = new FormData();
          formData.append('file', file);
          const response = await axios.post('http://localhost:3001/extract-text', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          setExtractedText(response.data.extractedText);
        } catch (error) {
          setError('Error processing image: ' + error);
        } finally {
          setIsLoading(false);
        }
      }
    }
  };

  const handleQuestionCountChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setQuestionCount(parseInt(event.target.value));
  };

  const handleDifficultyChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setDifficulty(event.target.value);
  };

  const handleQuestionTypeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedQuestionType(event.target.value);
  };

  const parseNotecards = (text: string): Notecard[] => {
    const cards: Notecard[] = [];
    let regex;

    if (selectedQuestionType === 'multiple choice') {
      regex = /objective(\d+)=\{?(.*?)\}?\nchoices\1=\{?(.*?)\}?\ncorrectAnswer\1=\{?(.*?)\}?\nanswer\1=\{?(.*?)\}?(?=\n(?:objective|$))/gs;
      let match;
      while ((match = regex.exec(text)) !== null) {
        const [, , objective, choices, correctAnswer, explanation] = match;
        cards.push({
          objective: objective.trim(),
          choices: choices.split('|').map(choice => choice.trim()),
          correctAnswer: correctAnswer.trim(),
          explanation: explanation.trim()
        });
      }
    } else {
      // For true/false, short answer, and essay
      regex = /objective(\d+)=\{?(.*?)\}?\nanswer\1=\{?(.*?)\}?(?=\n(?:objective|$))/gs;
      let match;
      while ((match = regex.exec(text)) !== null) {
        const [, , objective, explanation] = match;
        cards.push({
          objective: objective.trim(),
          explanation: explanation.trim()
        });
      }
    }


    return cards;
  };

  const saveNotecardsToFirestore = async (notecards: Notecard[], userEmail: string) => {
    try {
      const notesHistoryCollection = collection(db, 'notesHistory');
      const docData = {
        userEmail: userEmail,
        notecards: notecards,
        createdAt: new Date(),
        sourceLink: input
      };
      const docRef = await addDoc(notesHistoryCollection, docData);
      return docRef;
    } catch (error) {
      throw error;
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !user.email) {
      router.push('/registration/login');
      return;
    }
    if (!input && !file) {
      setError('Please enter a URL or upload a file.');
      return;
    }
    setIsLoading(true);
    setError('');
    setNotecards([]);
    setLogs([]);
    setShowResults(false);
  
    try {
      let textToProcess = '';
      if (uploadType === 'url') {
        const response = await axios.post<{ summarizedText: string }>(
          'http://localhost:3001/scrape', 
          { 
            url: input,
            email: user.email,
            questionCount,
            difficulty,
            questionType: selectedQuestionType
          }
        );
        textToProcess = response.data.summarizedText;
      } else if (uploadType === 'png') {
        textToProcess = extractedText;
      } else if (uploadType === 'file' || uploadType === 'mp4' || uploadType === 'youtube') {
        const formData = new FormData();
        formData.append('file', file as File);
        formData.append('uploadType', uploadType);
        formData.append('email', user.email);
        formData.append('questionCount', questionCount.toString());
        formData.append('difficulty', difficulty);
        formData.append('questionType', selectedQuestionType);

        const response = await axios.post<{ extractedText: string }>(
          'http://localhost:3001/process-file',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        textToProcess = response.data.extractedText;
      }

      if (textToProcess) {
        const response = await axios.post<{ generatedQuestions: string }>(
          'http://localhost:3001/generate-questions',
          {
            text: textToProcess,
            questionCount,
            difficulty,
            questionType: selectedQuestionType
          }
        );

        const generatedQuestions = response.data.generatedQuestions;
        console.log('Generated questions:', generatedQuestions);
        const cards = parseNotecards(generatedQuestions);
        console.log('Parsed notecards:', cards);
        if (cards.length > 0) {
          setNotecards(cards);
          await saveNotecardsToFirestore(cards, user.email);
          setShowResults(true);
        } else {
          setError('No valid notecards found in the response.');
        }
      } else {
        setError('No text received to process.');
      }
    } catch (error: any) {
      console.error('Error in handleSubmit:', error);
      setError(`Failed to fetch or save notes: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const renderInputField = () => {
    switch (uploadType) {
      case 'url':
        return (
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Enter a URL"
            className="w-full border border-gray-300 p-2 rounded"
          />
        );
      case 'file':
      case 'mp4':
      case 'png':
        return (
          <div className="relative">
            <input
              type="file"
              onChange={handleFileChange}
              accept={uploadType === 'file' ? ".pdf,.docx,.txt" : uploadType === 'mp4' ? ".mp4" : ".png"}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer bg-white border border-gray-300 rounded py-2 px-4 inline-flex items-center w-full"
            >
              <span className="mr-2">
                {uploadType === 'file' ? <File size={18} /> : uploadType === 'mp4' ? <Video size={18} /> : <Image size={18} />}
              </span>
              <span className="text-gray-700">
                {file ? file.name : `Choose ${uploadType.toUpperCase()} file`}
              </span>
            </label>
          </div>
        );
      case 'youtube':
        return (
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Enter YouTube video URL"
            className="w-full border border-gray-300 p-2 rounded"
          />
        );
    }
  };

  const renderContent = () => {
    if (['true/false', 'short answer'].includes(selectedQuestionType)) {
      return <CarouselView notecards={notecards} />;
    } else if (selectedQuestionType === 'multiple choice') {
      return <MultipleChoiceView notecards={notecards} />;
    } else if (selectedQuestionType === 'essay') {
      return <EssayView notecards={notecards} />;
    } else {
      return <DefaultView notecards={notecards} />;
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl p-8 rounded-lg shadow-xl">
        <h1 className="text-2xl font-bold text-center mb-4 text-gray-800">Generate Algebra Questions!</h1>
        {!showResults ? (
          <>
            <p className="text-center text-gray-600 mb-6">Choose an input method to generate algebra questions.</p>
            <div className="flex justify-center mb-4 flex-wrap">
              <button
                onClick={() => handleUploadTypeChange('url')}
                className={`m-1 px-4 py-2 rounded flex items-center ${uploadType === 'url' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                <Link className="mr-2" size={18} />
                URL
              </button>
              <button
                onClick={() => handleUploadTypeChange('file')}
                className={`m-1 px-4 py-2 rounded flex items-center ${uploadType === 'file' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                <File className="mr-2" size={18} />
                File
              </button>
              <button
                onClick={() => handleUploadTypeChange('mp4')}
                className={`m-1 px-4 py-2 rounded flex items-center ${uploadType === 'mp4' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                <Video className="mr-2" size={18} />
                MP4
              </button>
              <button
                onClick={() => handleUploadTypeChange('youtube')}
                className={`m-1 px-4 py-2 rounded flex items-center ${uploadType === 'youtube' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                <Youtube className="mr-2" size={18} />
                YouTube
              </button>
              <button
                onClick={() => handleUploadTypeChange('png')}
                className={`m-1 px-4 py-2 rounded flex items-center ${uploadType === 'png' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                <Image className="mr-2" size={18} />
                PNG
              </button>
            </div>
            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
              {renderInputField()}
              <div className="flex justify-between">
                <label className="w-1/3">
                  Question Count:
                  <select value={questionCount} onChange={handleQuestionCountChange} className="ml-2 border border-gray-300 rounded">
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={20}>20</option>
                  </select>
                </label>
                <label className="w-1/3">
                  Difficulty:
                  <select value={difficulty} onChange={handleDifficultyChange} className="ml-2 border border-gray-300 rounded">
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </label>
                <label className="w-1/3">
                  Question Type:
                  <select value={selectedQuestionType} onChange={handleQuestionTypeChange} className="ml-2 border border-gray-300 rounded">
                    <option value="true/false">True/False</option>
                    <option value="short answer">Short Answer</option>
                    <option value="multiple choice">Multiple Choice</option>
                    <option value="essay">Essay</option>
                  </select>
                </label>
              </div>
              {error && <p className="text-red-500">{error}</p>}
              <button
                type="submit"
                className="bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Generate Algebra Questions'}
              </button>
            </form>
          </>
        ) : (
          renderContent()
        )}
        {isLoading && (
          <div className="mt-4">
            <div className="flex items-center justify-center mb-2">
              <Loader className="animate-spin mr-2" />
              <span>Processing...</span>
            </div>
            <div className="mt-4 max-h-40 overflow-y-auto">
              {logs.map((log, index) => (
                <p key={index} className="text-sm text-gray-600">{log}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadAlgebra;