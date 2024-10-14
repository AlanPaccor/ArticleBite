"use client";

import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { User } from 'firebase/auth';
import { auth, db } from '../../lib/firebase-config';
import { collection, addDoc } from 'firebase/firestore';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Share2, X, Loader } from 'lucide-react';
import OpenAI from 'openai';
import { useTheme } from '../../contexts/ThemeContext';

interface Notecard {
  objective: string;
  explanation: string;
  choices?: string[];
  correctAnswer?: string;
}

const Card = ({ objective, explanation, isFlipped, onClick }: { objective: string; explanation: string; isFlipped: boolean; onClick: () => void }) => (
  <div
    className={`card w-full max-w-2xl h-64 sm:h-80 bg-blue-200 rounded-lg shadow-lg text-gray-800 cursor-pointer transition-transform duration-500 transform ${isFlipped ? 'rotate-y-180' : ''}`}
    onClick={onClick}
    style={{
      perspective: '1000px',
      transformStyle: 'preserve-3d',
    }}
  >
    {/* Front Side (Question) */}
    <div className={`absolute w-full h-full backface-hidden transition-opacity duration-500 ${isFlipped ? 'opacity-0' : 'opacity-100'}`}>
      <div className="text-center px-3 sm:px-8 py-4 sm:py-10 h-full flex flex-col justify-center">
        <h2 className="text-lg sm:text-3xl font-bold mb-2 sm:mb-4">Question</h2>
        <p className="text-sm sm:text-xl overflow-y-auto">{objective}</p>
      </div>
    </div>
    
    {/* Back Side (Answer) */}
    <div className={`absolute w-full h-full backface-hidden rotate-y-180 transition-opacity duration-500 ${isFlipped ? 'opacity-100' : 'opacity-0'}`}>
      <div className="text-center px-3 sm:px-8 py-4 sm:py-10 h-full flex flex-col justify-center">
        <h2 className="text-lg sm:text-3xl font-bold mb-2 sm:mb-4">Answer</h2>
        <p className="text-sm sm:text-xl overflow-y-auto">{explanation}</p>
      </div>
    </div>
  </div>
);

const CarouselView = ({ notecards }: { notecards: Notecard[] }) => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [touchStart, setTouchStart] = useState<number | null>(null);

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

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    if (diff > 50) {
      goToNextCard();
    } else if (diff < -50) {
      goToPreviousCard();
    }

    setTouchStart(null);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto px-4">
      <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4 sm:mb-8 hidden sm:block">Flashcards</h2>
      <div className="w-full flex items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
        <button
          onClick={goToPreviousCard}
          disabled={currentCardIndex === 0}
          className="w-10 h-10 flex items-center justify-center bg-blue-500 text-white rounded-full disabled:bg-gray-300 disabled:cursor-not-allowed"
          aria-label="Previous card"
        >
          <ChevronLeft size={24} />
        </button>
        <div 
          className="w-full max-w-sm sm:max-w-2xl aspect-[3/2] flex items-center justify-center"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
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
          className="w-10 h-10 flex items-center justify-center bg-blue-500 text-white rounded-full disabled:bg-gray-300 disabled:cursor-not-allowed"
          aria-label="Next card"
        >
          <ChevronRight size={24} />
        </button>
      </div>
      <p className="mt-2 sm:mt-6 text-xs sm:text-lg">
        Question {currentCardIndex + 1} of {notecards.length}
      </p>
    </div>
  );
};

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
      <h2 className="text-xl sm:text-2xl font-bold text-center mb-4">Multiple Choice Questions</h2>
      <div className="w-full max-w-4xl">
        {notecards.map((question, questionIndex) => (
          <div key={questionIndex} className="mb-8 p-4 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Question {questionIndex + 1}:</h3>
            <p className="mb-4">{question.objective}</p>
            <div className="pl-4">
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
      <div className="mt-4 flex flex-col sm:flex-row items-center">
        <button
          onClick={checkAnswers}
          disabled={showResults}
          className="w-full sm:w-auto mb-4 sm:mb-0 sm:mr-4 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition dark:bg-blue-600 dark:hover:bg-blue-700"
        >
          Check Answers
        </button>
        {showResults && (
          <p className="text-lg font-semibold">
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
      <h2 className="text-xl sm:text-2xl font-bold text-center mb-4">Essay Questions</h2>
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
        className="w-full sm:w-auto mt-4 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition"
        onClick={checkAnswers}
        disabled={isChecking}
      >
        {isChecking ? 'Checking...' : 'Check Answers'}
      </button>
    </div>
  );
};

const DefaultView = ({ notecards }: { notecards: Notecard[] }) => (
  <div>
    <h2>Default View</h2>
    <ul>
      {notecards.map((card, index) => (
        <li key={index}>
          <strong>Question:</strong> {card.objective}
          <br />
          <strong>Answer:</strong> {card.explanation}
        </li>
      ))}
    </ul>
  </div>
);

const Upload: React.FC = () => {
  const [link, setLink] = useState<string>('');
  const [notecards, setNotecards] = useState<Notecard[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [user, setUser] = useState<User | null>(null);
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<string>('Easy');
  const [selectedQuestionType, setSelectedQuestionType] = useState<string>('true/false');
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);
  const [showGenerateButton, setShowGenerateButton] = useState(true);
  const [customQuestionCount, setCustomQuestionCount] = useState<string>('');
  const { isDarkMode } = useTheme();
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

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setLink(event.target.value);
  };

  const handleQuestionCountChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    if (value === 'custom') {
      setQuestionCount(0);
    } else {
      setQuestionCount(parseInt(value));
      setCustomQuestionCount(''); // Reset custom count when selecting a preset
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

    return cards;
  };

  const saveNotecardsToFirestore = async (notecards: Notecard[], userEmail: string) => {
    const notesHistoryCollection = collection(db, 'notesHistory');
    const docData = {
      userEmail: userEmail,
      notecards: notecards,
      createdAt: new Date(),
      sourceLink: link
    };
    const docRef = await addDoc(notesHistoryCollection, docData);
    return docRef;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setShowGenerateButton(false);
    if (!user || !user.email) {
      router.push('/registration/login');
      return;
    }
    if (!link) {
      setError('Please enter a URL to scrape.');
      return;
    }
    setIsLoading(true);
    setError('');
    setNotecards([]);
    setLogs([]);
  
    try {
      const response = await axios.post<{ summarizedText: string }>(
        'http://localhost:3001/scrape', 
        { 
          url: link,
          email: user.email,
          questionCount,
          difficulty,
          questionType: selectedQuestionType
        }
      );

      const { summarizedText } = response.data;
      
      if (summarizedText) {
        console.log('Received summarized text:', summarizedText);
        const cards = parseNotecards(summarizedText);
        console.log('Parsed notecards:', cards);
        if (cards.length > 0) {
          setNotecards(cards);
          const docRef = await saveNotecardsToFirestore(cards, user.email);
          setShareUrl(`${window.location.origin}/shared/${docRef.id}`);
        } else {
          setError('No valid notecards found in the response.');
        }
      } else {
        setError('No summarized text received from the server.');
      }
    } catch (error: any) {
      console.error('Error in handleSubmit:', error);
      setError(`Failed to fetch or save notes: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  const handleCloseShareModal = () => {
    setIsShareModalOpen(false);
  };

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert('Share link copied to clipboard!');
    });
  };

  useEffect(() => {
    let eventSource: EventSource | null = null;

    if (isLoading) {
      eventSource = new EventSource('http://localhost:3001/progress');
      
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setLogs(prevLogs => [...prevLogs, data.step]);
      };

      eventSource.onerror = () => {
        eventSource?.close();
      };
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [isLoading]);

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
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <div className={`w-full max-w-4xl p-4 sm:p-8 rounded-lg shadow-xl ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
        {notecards.length === 0 ? (
          <>
            <h1 className={`text-xl sm:text-2xl font-bold text-center mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Upload A Link To Generate Notes!</h1>
            <p className={`text-center mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Provide a URL and we&apos;ll scrape the content to generate flashcards for you.</p>
            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
              <input
                type="text"
                value={link}
                onChange={handleInputChange}
                placeholder="Enter a URL"
                className={`w-full border p-2 rounded ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'}`}
              />
             
              {/* Mobile View (visible on smaller screens) */}
              <div className="sm:hidden flex flex-col gap-4">
                <label className="flex flex-col">
                  <span className="mb-1">Count:</span>
                  {questionCount === 0 || customQuestionCount !== '' ? (
                    <input
                      type="number"
                      value={customQuestionCount}
                      onChange={handleCustomQuestionCountChange}
                      placeholder="Enter number"
                      className={`w-full border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'} rounded p-2`}
                    />
                  ) : (
                    <select 
                      value={questionCount.toString()} 
                      onChange={handleQuestionCountChange} 
                      className={`w-full border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'} rounded p-2`}
                    >
                      <option value="5">5</option>
                      <option value="10">10</option>
                      <option value="15">15</option>
                      <option value="20">20</option>
                      <option value="custom">Custom</option>
                    </select>
                  )}
                </label>
                <label className="flex flex-col">
                  <span className="mb-1">Difficulty:</span>
                  <select 
                    value={difficulty} 
                    onChange={handleDifficultyChange} 
                    className={`w-full border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'} rounded p-2`}
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </label>
                <label className="flex flex-col">
                  <span className="mb-1">Type:</span>
                  <select 
                    value={selectedQuestionType} 
                    onChange={handleQuestionTypeChange} 
                    className={`w-full border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'} rounded p-2`}
                  >
                    <option value="true/false">True/False</option>
                    <option value="short answer">Short Answer</option>
                    <option value="multiple choice">Multiple Choice</option>
                    <option value="essay">Essay</option>
                  </select>
                </label>
              </div>

              {/* PC View (visible on larger screens) */}
              <div className="hidden sm:flex sm:flex-row justify-between gap-4">
                <label className="w-1/3 flex flex-col">
                  <span className="mb-1">Count:</span>
                  {questionCount === 0 || customQuestionCount !== '' ? (
                    <input
                      type="number"
                      value={customQuestionCount}
                      onChange={handleCustomQuestionCountChange}
                      placeholder="Enter number"
                      className={`w-full border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'} rounded p-2`}
                    />
                  ) : (
                    <select 
                      value={questionCount.toString()} 
                      onChange={handleQuestionCountChange} 
                      className={`w-full border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'} rounded p-2`}
                    >
                      <option value="5">5</option>
                      <option value="10">10</option>
                      <option value="15">15</option>
                      <option value="20">20</option>
                      <option value="custom">Custom</option>
                    </select>
                  )}
                </label>
                <label className="w-1/3 flex flex-col">
                  <span className="mb-1">Difficulty:</span>
                  <select 
                    value={difficulty} 
                    onChange={handleDifficultyChange} 
                    className={`w-full border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'} rounded p-2`}
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </label>
                <label className="w-1/3 flex flex-col">
                  <span className="mb-1">Type:</span>
                  <select 
                    value={selectedQuestionType} 
                    onChange={handleQuestionTypeChange} 
                    className={`w-full border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'} rounded p-2`}
                  >
                    <option value="true/false">True/False</option>
                    <option value="short answer">Short Answer</option>
                    <option value="multiple choice">Multiple Choice</option>
                    <option value="essay">Essay</option>
                  </select>
                </label>
              </div>

              {error && <p className="text-red-500">{error}</p>}
              {showGenerateButton && (
                <button
                  type="submit"
                  className={`${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white py-2 rounded transition`}
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : 'Scrape and Generate Notes'}
                </button>
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
            </form>
          </>
        ) : (
          <>
            <h1 className={`text-xl sm:text-2xl font-bold text-center mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Generated Notes</h1>
            <button
              onClick={handleShare}
              className={`mb-4 ${isDarkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white py-2 px-4 rounded transition flex items-center justify-center w-full sm:w-auto`}
            >
              <Share2 className="mr-2" /> Share These Notes
            </button>
            {renderContent()}
          </>
        )}
      </div>
      {isShareModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Share These Notes</h2>
              <button onClick={handleCloseShareModal} className="text-gray-500 hover:text-gray-700">
                <X />
              </button>
            </div>
            <p className="mb-4">Copy this link to share your notes:</p>
            <div className="flex">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-grow border rounded-l px-2 py-1"
              />
              <button
                onClick={handleCopyShareLink}
                className="bg-blue-500 text-white px-4 py-1 rounded-r hover:bg-blue-600 transition"
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Upload;