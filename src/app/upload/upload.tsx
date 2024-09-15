"use client";

import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import './UploadPage.css';
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
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setLink(event.target.value);
  };

  const parseNotecards = (text: string): Notecard[] => {
    console.log('Parsing notecards from text:', text);
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

    console.log('Parsed notecards:', cards);
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
      console.log('Notecards saved to Firestore');
    } catch (error) {
      console.error('Error saving notecards to Firestore:', error);
      throw error;
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !user.email) {
      console.log('No user or user email, redirecting to /login');
      router.push('/login');
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
      console.log('Sending request to server with URL:', link, 'and email:', user.email);
      const response = await axios.post<{ summarizedText: string }>('http://localhost:3001/scrape', { 
        url: link,
        email: user.email
      });
      console.log('Received response:', response.data);
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
      console.error('Error fetching or saving notes:', error);
      setError(`Failed to fetch or save notes: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    console.log('Attempting to sign out');
    try {
      await signOut(auth);
      console.log('Sign out successful, redirecting to /login');
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      setError('Failed to sign out. Please try again.');
    }
  };

  if (!user) {
    return <div>Loading...</div>; // Or a more sophisticated loading indicator
  }

  return (
    <div className='uPageContainer'>
      <div className='uPageTitleContainer'>
        <h1>Upload A Link To Get Your Generated Notes!</h1>
      </div>
      <div>
        <p>Welcome, {user.displayName || user.email}!</p>
        <button onClick={handleSignOut}>Sign Out</button>
        <form onSubmit={handleSubmit}>
          <input 
            type="text" 
            value={link} 
            onChange={handleInputChange} 
            placeholder="Enter the URL" 
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Scraping...' : 'Scrape'}
          </button>
        </form>
        {error && <p className="error">{error}</p>}
        {notecards.length > 0 && (
          <div className="notecards">
            <h2>Generated Notecards:</h2>
            {notecards.map((card, index) => (
              <div key={index} className="notecard">
                <h3>{card.objective}</h3>
                <p>{card.explanation}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}