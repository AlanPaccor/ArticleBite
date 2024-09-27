"use client";

import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { User } from 'firebase/auth';
import { auth, db } from '../../lib/firebase-config';
import { collection, addDoc } from 'firebase/firestore';
import { TiChevronLeftOutline, TiChevronRightOutline } from 'react-icons/ti';
import { v4 as uuidv4 } from 'uuid';
import { Share2, X, Loader } from 'lucide-react';

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

// Add this new component for essay questions
const EssayView = ({ notecards }: { notecards: Notecard[] }) => {
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});

  const handleAnswerChange = (questionIndex: number, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionIndex]: answer }));
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
          </div>
        ))}
      </div>
      <button
        className="mt-4 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition"
      >
        Check Answers
      </button>
    </div>
  );
};

const ComplexQuestionsView = ({ notecards }: { notecards: Notecard[] }) => (
  <div>
    <h2>Complex Questions View</h2>
    {/* Implement your complex questions display here */}
  </div>
);

const DefaultView = ({ notecards }: { notecards: Notecard[] }) => (
  <div>
    <h2>Default View</h2>
    {/* Implement your default view here */}
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
  const [progress, setProgress] = useState<number>(0);
  const [progressStep, setProgressStep] = useState<string>('');
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);
  const [showGenerateButton, setShowGenerateButton] = useState(true);
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
    const objectiveRegex = /objective(\d+)=\{([^}]+)\}/g;
    const answerRegex = /answer(\d+)=\{([^}]+)\}/g;
    const choicesRegex = /choices(\d+)=\{([^}]+)\}/g;
    const correctAnswerRegex = /correctAnswer(\d+)=\{([^}]+)\}/g;

    const objectives: { [key: string]: string } = {};
    const answers: { [key: string]: string } = {};
    const choices: { [key: string]: string[] } = {};
    const correctAnswers: { [key: string]: string } = {};

    let match: RegExpExecArray | null;

    while ((match = objectiveRegex.exec(text)) !== null) {
      objectives[match[1]] = match[2].trim();
    }

    while ((match = answerRegex.exec(text)) !== null) {
      answers[match[1]] = match[2].trim();
    }

    while ((match = choicesRegex.exec(text)) !== null) {
      choices[match[1]] = match[2].split('|').map(choice => choice.trim());
    }

    while ((match = correctAnswerRegex.exec(text)) !== null) {
      correctAnswers[match[1]] = match[2].trim();
    }

    Object.keys(objectives).forEach(key => {
      const card: Notecard = {
        objective: objectives[key],
        explanation: answers[key] || '', // Use an empty string if no answer is found
      };
      if (choices[key]) {
        card.choices = choices[key];
        card.correctAnswer = correctAnswers[key];
      }
      cards.push(card);
    });

    return cards;
  };

  const saveNotecardsToFirestore = async (notecards: Notecard[], userEmail: string) => {
    try {
      const notesHistoryCollection = collection(db, 'notesHistory');
      const docData = {
        userEmail: userEmail,
        notecards: notecards,
        createdAt: new Date(),
        sourceLink: link
      };
      const docRef = await addDoc(notesHistoryCollection, docData);
      return docRef;
    } catch (error) {
      throw error;
    }
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
        console.log('Received summarized text:', summarizedText); // Add this line
        const cards = parseNotecards(summarizedText);
        console.log('Parsed notecards:', cards); // Add this line
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
      console.error('Error in handleSubmit:', error); // Add this line
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl p-8 rounded-lg shadow-xl">
        {notecards.length === 0 ? (
          <>
            <h1 className="text-2xl font-bold text-center mb-4 text-gray-800">Upload A Link To Generate Notes!</h1>
            <p className="text-center text-gray-600 mb-6">Provide a URL and we'll scrape the content to generate flashcards for you.</p>
            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
              <input
                type="text"
                value={link}
                onChange={handleInputChange}
                placeholder="Enter a URL"
                className="w-full border border-gray-300 p-2 rounded"
              />
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
              {showGenerateButton && (
                <button
                  type="submit"
                  className="bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
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
                      <p key={index} className="text-sm text-gray-600">{log}</p>
                    ))}
                  </div>
                </div>
              )}
            </form>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-center mb-4 text-gray-800">Generated Notes</h1>
            <button
              onClick={handleShare}
              className="mb-4 bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition flex items-center"
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
