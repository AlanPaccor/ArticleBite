"use client";

import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { User } from 'firebase/auth';
import { auth, signOut, db } from '../lib/firebase-config';
import { collection, addDoc } from 'firebase/firestore';

interface Notecard {
  objective: string;
  explanation: string;
}

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
    const objectiveRegex = /objective(\d+)={([^}]+)}/g;
    const answerRegex = /answer(\d+)={([^}]+)}/g;

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
      await addDoc(notesHistoryCollection, docData);
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
  
    try {
      const response = await axios.post<{ summarizedText: string }>('http://localhost:3001/scrape', { 
        url: link,
        email: user.email,
        questionCount,
        difficulty,
        questionType
      });
      const summarizedText = response.data.summarizedText;
      
      if (summarizedText) {
        const cards = parseNotecards(summarizedText);
        if (cards.length > 0) {
          setNotecards(cards);
          await saveNotecardsToFirestore(cards, user.email);
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

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl bg-white p-8 rounded shadow-md">
        {notecards.length === 0 && (
          <>
            <h1 className="text-2xl font-bold text-center mb-4 text-gray-800">Upload A Link To Generate Notes!</h1>
            <p className="text-center text-gray-600 mb-6">Welcome, {user.displayName || user.email}!</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col">
                <input
                  type="text"
                  value={link}
                  onChange={handleInputChange}
                  placeholder="Enter the URL to scrape"
                  className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              <div className="flex flex-col">
                <label htmlFor="questionCount">Number of Questions</label>
                <select
                  id="questionCount"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="px-4 py-2 border border-gray-300 rounded-md"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label htmlFor="difficulty">Difficulty Level</label>
                <select
                  id="difficulty"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label htmlFor="questionType">Question Type</label>
                <select
                  id="questionType"
                  value={questionType}
                  onChange={(e) => setQuestionType(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md"
                >
                  <option value="multiple choice">Multiple Choice</option>
                  <option value="true/false">True/False</option>
                  <option value="short answer">Short Answer</option>
                  <option value="essay">Essay</option>
                </select>
              </div>

              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
              >
                {isLoading ? 'Loading...' : 'Scrape and Generate Notes'}
              </button>
            </form>
          </>
        )}

        {notecards.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 perspective">
            {notecards.map((card, index) => (
              <div
                key={index}
                className={`relative w-full h-48 transform-style-preserve-3d overflow-hidden bg-blue-200 p-4 rounded-lg shadow-lg text-white cursor-pointer ${flippedCards.includes(index) ? 'flipped' : ''}`}
                onClick={() => handleCardFlip(index)}
              >
                <div className="card-inner transform-style-preserve-3d">
                  <div className="card-front">
                    <h3 className="font-bold text-xl mb-2">{card.objective}</h3>
                  </div>
                  <div className="card-back absolute top-0 left-0 w-full h-full backface-hidden">
                    <p className="text-sm">{card.explanation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6">
          <a
            href='/userdashboard'
            className="text-blue-500 hover:underline text-sm"
          >
            Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
