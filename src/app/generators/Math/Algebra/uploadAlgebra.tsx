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
import Tesseract from 'tesseract.js';
import { MathJaxContext, MathJax } from 'better-react-mathjax';
import toast, { Toaster } from 'react-hot-toast'; // Add this import
import styles from './UploadPage.css'; // Make sure this CSS file exists
import { useTheme } from '../../../contexts/ThemeContext'; // Add this import

type UploadType = 'png' | 'file' | 'mp4' | 'youtube' | 'url';

interface Notecard {
  objective: string;
  explanation: string;
  choices?: string[];
  correctAnswer?: string;
}

const Card = ({ objective, explanation, isFlipped, onClick }: { objective: string; explanation: string; isFlipped: boolean; onClick: () => void }) => (
  <div
    className={`card w-full max-w-2xl h-120 bg-blue-200 rounded-lg shadow-lg text-gray-800 cursor-pointer transition-transform duration-500 transform ${isFlipped ? 'rotate-y-180' : ''}`}
    onClick={onClick}
    style={{
      perspective: '1000px',
      transformStyle: 'preserve-3d',
    }}
  >
    {/* Front Side (Question) */}
    <div className={`backface-hidden transition-opacity duration-500 ${isFlipped ? 'opacity-0' : 'opacity-100'}`}>
      <div className="text-center px-8 py-10">
        <h2 className="text-3xl font-bold mb-8">Question</h2>
        <p className="text-2xl">{objective}</p>
      </div>
    </div>
    
    {/* Back Side (Answer) */}
    <div className={`backface-hidden rotate-y-180 transition-opacity duration-500 ${isFlipped ? 'opacity-100' : 'opacity-0'}`}>
      <div className="text-center px-8 py-10">
        <h2 className="text-3xl font-bold mb-8">Answer</h2>
        <p className="text-2xl">{explanation}</p>
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
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);

  const handleCardFlip = (index: number) => {
    setFlippedCards((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const goToPreviousCard = () => {
    setCurrentCardIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : prevIndex));
  };

  const goToNextCard = () => {
    setCurrentCardIndex((prevIndex) => (prevIndex < notecards.length - 1 ? prevIndex + 1 : prevIndex));
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto px-4">
      <h2 className="text-3xl font-bold text-center mb-8">Flashcards</h2>
      <div className="w-full flex items-center justify-center space-x-4">
        <button
          onClick={goToPreviousCard}
          disabled={currentCardIndex === 0}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <div className="w-full max-w-2xl aspect-[3/2] flex items-center justify-center">
          <Card
            objective={notecards[currentCardIndex].objective}
            explanation={notecards[currentCardIndex].explanation}
            isFlipped={flippedCards.includes(currentCardIndex)}
            onClick={() => handleCardFlip(currentCardIndex)}
          />
        </div>
        <button
          onClick={goToNextCard}
          disabled={currentCardIndex === notecards.length - 1}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
      <p className="mt-6 text-xl">
        Question {currentCardIndex + 1} of {notecards.length}
      </p>
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
                            ? 'bg-green-200 dark:bg-green-700'
                            : 'bg-red-200 dark:bg-red-700'
                          : choice === question.correctAnswer
                            ? 'bg-green-200 dark:bg-green-700'
                            : ''
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
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
          className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition dark:bg-blue-600 dark:hover:bg-blue-700"
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
  const [uploadType, setUploadType] = useState<UploadType>('png');
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
  const [customQuestionCount, setCustomQuestionCount] = useState<string>('');
  const { isDarkMode } = useTheme();
  const router = useRouter();

  const demoNotecards: Notecard[] = [
    { objective: "What is 2 + 2?", explanation: "The answer is 4." },
    { objective: "Solve for x: 3x + 5 = 14", explanation: "x = 3" },
    { objective: "What is the square root of 16?", explanation: "The square root of 16 is 4." },
  ];

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
          console.log('Extracted text:', response.data.extractedText);
        } catch (error) {
          console.error('Error processing image:', error);
          setError('Error processing image: ' + (error as Error).message);
        } finally {
          setIsLoading(false);
        }
      }
    }
  };

  const handleQuestionCountChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    if (value === 'custom') {
      setQuestionCount(0);
      setCustomQuestionCount('');
    } else {
      setQuestionCount(parseInt(value));
      setCustomQuestionCount('');
    }
  };

  const handleCustomQuestionCountChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setCustomQuestionCount(value);
    if (value) {
      setQuestionCount(parseInt(value));
    } else {
      setQuestionCount(0);
    }
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

    console.log('Parsed notecards:', cards);  // Add this line for debugging
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
      toast.error('Please enter a URL or upload a file.');
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
        const response = await axios.post<{ extractedText: string }>(
          'http://localhost:3001/process-file',
          { 
            uploadType: 'url',
            url: input,
            email: user.email,
            questionCount,
            difficulty,
            questionType: selectedQuestionType
          }
        );
        textToProcess = response.data.extractedText;
      } else if (uploadType === 'png') {
        console.log('Processing PNG file...');
        const formData = new FormData();
        if (file) {
          formData.append('file', file);
        }
        formData.append('uploadType', uploadType);
        formData.append('email', user.email);
        formData.append('questionCount', questionCount.toString());
        formData.append('difficulty', difficulty);
        formData.append('questionType', selectedQuestionType);

        console.log('Sending request with formData:', Object.fromEntries(formData));

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
      } else if (uploadType === 'file' || uploadType === 'mp4' || uploadType === 'youtube') {
        const formData = new FormData();
        if (file) {
          formData.append('file', file);
        }
        formData.append('uploadType', uploadType);
        formData.append('email', user.email);
        formData.append('questionCount', questionCount.toString());
        formData.append('difficulty', difficulty);
        formData.append('questionType', selectedQuestionType);
        if (uploadType === 'youtube') {
          formData.append('url', input);
        }

        console.log('Sending request with formData:', Object.fromEntries(formData));

        try {
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
        } catch (error: any) {
          console.error('Error details:', error.response?.data);
          throw error;
        }
      }

      console.log('Received text to process:', textToProcess);

      if (textToProcess) {
        const cards = parseNotecards(textToProcess);
        console.log('Parsed notecards:', cards);
        if (cards.length > 0) {
          setNotecards(cards);
          await saveNotecardsToFirestore(cards, user.email);
          setShowResults(true);
          toast.success(`${cards.length} questions generated successfully!`);
        } else {
          toast.error('No valid notecards found in the response.');
        }
      } else {
        toast.error('No text received to process.');
      }
    } catch (error: any) {
      console.error('Error in handleSubmit:', error);
      let errorMessage = 'Failed to fetch or save notes';
      if (error.response && error.response.data && error.response.data.error) {
        errorMessage += `: ${error.response.data.error}`;
      } else if (error.message) {
        errorMessage += `: ${error.message}`;
      }
      toast.error(errorMessage);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
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
            className={`w-full border p-2 rounded ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'}`}
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
              accept={uploadType === 'file' ? ".pdf,.txt" : uploadType === 'mp4' ? ".mp4" : ".png"}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className={`cursor-pointer border rounded py-2 px-4 inline-flex items-center w-full ${
                isDarkMode 
                  ? 'bg-gray-700 text-white border-gray-600' 
                  : 'bg-white text-gray-700 border-gray-300'
              }`}
            >
              <span className="mr-2">
                {uploadType === 'file' ? <File size={18} /> : uploadType === 'mp4' ? <Video size={18} /> : <Image size={18} />}
              </span>
              <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
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
            className={`w-full border p-2 rounded ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'}`}
          />
        );
    }
  };

  const renderContent = () => {
    console.log('Rendering content, notecards:', notecards);  // Add this line for debugging
    if (['true/false', 'short answer'].includes(selectedQuestionType)) {
      return <CarouselView notecards={notecards} />;
    } else if (selectedQuestionType === 'multiple choice') {
      return <MultipleChoiceView notecards={notecards} />;
    } else if (selectedQuestionType === 'essay') {
      return <EssayView notecards={notecards} />;
    } else {
      return <div>Unsupported question type</div>;
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <Toaster position="top-center" reverseOrder={false} />
      <div className={`w-full max-w-4xl p-8 rounded-lg shadow-xl ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
        <h1 className={`text-2xl font-bold text-center mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Generate Algebra Questions!</h1>
        {!showResults ? (
          <>
            <p className={`text-center mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Choose an input method to generate algebra questions.</p>
            <div className="flex justify-center mb-4 flex-wrap">
              <button
                onClick={() => handleUploadTypeChange('png')}
                className={`m-1 px-4 py-2 rounded flex items-center ${
                  uploadType === 'png' 
                    ? 'bg-blue-500 text-white' 
                    : isDarkMode 
                      ? 'bg-gray-700 text-white hover:bg-gray-600' 
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                <Image className="mr-2" size={18} />
                PNG
              </button>
              <button
                onClick={() => handleUploadTypeChange('mp4')}
                className={`m-1 px-4 py-2 rounded flex items-center ${
                  uploadType === 'mp4' 
                    ? 'bg-blue-500 text-white' 
                    : isDarkMode 
                      ? 'bg-gray-700 text-white hover:bg-gray-600' 
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                <Video className="mr-2" size={18} />
                MP4
              </button>
              <button
                onClick={() => handleUploadTypeChange('youtube')}
                className={`m-1 px-4 py-2 rounded flex items-center ${
                  uploadType === 'youtube' 
                    ? 'bg-blue-500 text-white' 
                    : isDarkMode 
                      ? 'bg-gray-700 text-white hover:bg-gray-600' 
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                <Youtube className="mr-2" size={18} />
                YouTube
              </button>
              <button
                onClick={() => handleUploadTypeChange('url')}
                className={`m-1 px-4 py-2 rounded flex items-center ${
                  uploadType === 'url' 
                    ? 'bg-blue-500 text-white' 
                    : isDarkMode 
                      ? 'bg-gray-700 text-white hover:bg-gray-600' 
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                <Link className="mr-2" size={18} />
                URL
              </button>
              <button
                onClick={() => handleUploadTypeChange('file')}
                className={`m-1 px-4 py-2 rounded flex items-center ${
                  uploadType === 'file' 
                    ? 'bg-blue-500 text-white' 
                    : isDarkMode 
                      ? 'bg-gray-700 text-white hover:bg-gray-600' 
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                <File className="mr-2" size={18} />
                File
              </button>
            </div>
            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
              {renderInputField()}
              <div className="flex justify-between">
                <label className="w-1/3 flex items-center">
                  Question Count:
                  {questionCount === 0 || customQuestionCount !== '' ? (
                    <input
                      type="number"
                      value={customQuestionCount}
                      onChange={handleCustomQuestionCountChange}
                      placeholder="Enter number"
                      className={`ml-2 w-20 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'} rounded p-1`}
                    />
                  ) : (
                    <select 
                      value={questionCount.toString()} 
                      onChange={handleQuestionCountChange} 
                      className={`ml-2 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'} rounded p-1`}
                    >
                      <option value="5">5</option>
                      <option value="10">10</option>
                      <option value="15">15</option>
                      <option value="20">20</option>
                      <option value="custom">Custom</option>
                    </select>
                  )}
                </label>
                <label className="w-1/3">
                  Difficulty:
                  <select 
                    value={difficulty} 
                    onChange={handleDifficultyChange} 
                    className={`ml-2 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'} rounded p-1`}
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </label>
                <label className="w-1/3">
                  Question Type:
                  <select 
                    value={selectedQuestionType} 
                    onChange={handleQuestionTypeChange} 
                    className={`ml-2 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'} rounded p-1`}
                  >
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
                className={`${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white py-2 rounded transition`}
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Generate Algebra Questions'}
              </button>
            </form>
          </>
        ) : (
          <>
            {renderContent()}
            <button
              onClick={() => setShowResults(false)}
              className={`mt-4 ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white py-2 px-4 rounded transition`}
            >
              Generate New Questions
            </button>
          </>
        )}
        {isLoading && (
          <div className="mt-4">
            <div className="flex items-center justify-center mb-2">
              <Loader className="animate-spin mr-2" />
              <span>Processing...</span>
            </div>
            <div className="mt-4 max-h-40 overflow-y-auto">
              {logs.map((log, index) => (
                <p key={index} className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{log}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadAlgebra;