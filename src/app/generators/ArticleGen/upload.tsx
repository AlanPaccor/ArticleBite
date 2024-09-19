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
    <div className={` backface-hidden transition-opacity duration-500 ${isFlipped ? 'opacity-0' : 'opacity-100'}`}>
      <div className="text-center px-4">
        <h2 className="text-xl font-bold mb-4">Question</h2>
        <p className="text-lg">{objective}</p>
      </div>
    </div>
    
    {/* Back Side (Answer) */}
    <div className={` backface-hidden rotate-y-180 transition-opacity duration-500 ${isFlipped ? 'opacity-100' : 'opacity-0'}`}>
      <div className="text-center px-4">
        <h2 className="text-xl font-bold mb-4">Answer</h2>
        <p className="text-lg">{explanation}</p>
      </div>
    </div>
  </div>
);



const Carousel = ({ children }: { children: React.ReactNode }) => {
  const [active, setActive] = useState(0); // Set the starting card to the first one
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


export default function UploadPage() {
  const [link, setLink] = useState<string>('');
  const [notecards, setNotecards] = useState<Notecard[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<string>('Easy');
  const [questionType, setQuestionType] = useState<string>('Multiple Choice');
  const [progress, setProgress] = useState<number>(0);
  const [progressStep, setProgressStep] = useState<string>('');
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);
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
    setQuestionType(event.target.value);
  };

  const parseNotecards = (text: string): Notecard[] => {
    const cards: Notecard[] = [];
    const objectiveRegex = /objective(\d+)=\{([^}]+)\}/g;
    const answerRegex = /answer(\d+)=\{([^}]+)\}/g;

    const objectives: { [key: string]: string } = {};
    const answers: { [key: string]: string } = {};

    let match: RegExpExecArray | null;

    while ((match = objectiveRegex.exec(text)) !== null) {
      objectives[match[1]] = match[2].trim();
    }

    while ((match = answerRegex.exec(text)) !== null) {
      answers[match[1]] = match[2].trim();
    }

    Object.keys(objectives).forEach(key => {
      if (answers[key]) {
        cards.push({
          objective: objectives[key],
          explanation: answers[key]
        });
      }
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
          questionType
        }
      );

      const { summarizedText } = response.data;
      
      if (summarizedText) {
        const cards = parseNotecards(summarizedText);
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
      setError(`Failed to fetch or save notes: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardFlip = (index: number) => {
    setFlippedCards((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
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
                  <select value={questionCount} onChange={handleQuestionCountChange} className="ml-2">
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={20}>20</option>
                  </select>
                </label>
                <label className="w-1/3">
                  Difficulty:
                  <select value={difficulty} onChange={handleDifficultyChange} className="ml-2">
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </label>
                <label className="w-1/3">
                  Question Type:
                  <select value={questionType} onChange={handleQuestionTypeChange} className="ml-2">
                    <option value="Multiple Choice">Multiple Choice</option>
                    <option value="True/False">True/False</option>
                    <option value="Short Answer">Short Answer</option>
                    <option value="Essay">Essay</option>
                  </select>
                </label>
              </div>
              {error && <p className="text-red-500">{error}</p>}
              <button
                type="submit"
                className="bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Scrape and Generate Notes'}
              </button>
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
            <Carousel>
              {notecards.map((notecard, index) => (
                <Card
                  key={index}
                  objective={notecard.objective}
                  explanation={notecard.explanation}
                  isFlipped={flippedCards.includes(index)}
                  onClick={() => handleCardFlip(index)}
                />
              ))}
            </Carousel>
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
}
