"use client";

import React, { useEffect, useState } from 'react';
import { getFirestore, collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';

const db = getFirestore();

interface Notecard {
  objective: string;
  explanation: string;
}

interface NotecardSet {
  userEmail: string;
  notecards: Notecard[];
  createdAt: Timestamp;
  sourceLink: string;
}

export default function History({ isDarkMode }: { isDarkMode: boolean }) {
  const [notecardSets, setNotecardSets] = useState<NotecardSet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [expandedSetIndex, setExpandedSetIndex] = useState<number | null>(null);
  const auth = getAuth();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchNotecards(user.email);
      } else {
        router.push('/registration/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchNotecards = async (userEmail: string | null) => {
    if (!userEmail) {
      setError('User email not found.');
      setLoading(false);
      return;
    }
  
    try {
      console.log('Fetching notecards for user:', userEmail);
      const q = query(
        collection(db, 'notesHistory'),
        where('userEmail', '==', userEmail),
        where('createdAt', '>=', Timestamp.fromDate(new Date(Date.now() - 14 * 24 * 60 * 60 * 1000))),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        setError('No notecards found.');
        return;
      }
      const sets = querySnapshot.docs.map(doc => {
        const data = doc.data() as NotecardSet;
        return {
          ...data,
          createdAt: data.createdAt.toDate()
        };
      });
      console.log('Fetched notecards:', sets);
      setNotecardSets(sets);
    } catch (error) {
      console.error('Error fetching notecards:', error);
      setError(`Failed to fetch notecards: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExpand = (index: number) => {
    setExpandedSetIndex(expandedSetIndex === index ? null : index);
  };

  if (loading) return <p className={`text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading...</p>;
  if (error) return <p className={`text-center ${isDarkMode ? 'text-red-400' : 'text-red-500'}`}>{error}</p>;

  return (
    <div className={`p-6 max-w-4xl mx-auto ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <h1 className={`text-2xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Your Notecards from the Past 14 Days</h1>
      {notecardSets.length > 0 ? (
        notecardSets.map((set, setIndex) => (
          <div 
            key={setIndex} 
            className={`shadow-md rounded-lg mb-4 cursor-pointer ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'} border`}
            onClick={() => handleExpand(setIndex)}
          >
            <div className={`p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <h2 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {set.createdAt.toLocaleDateString()}
              </h2>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>{set.sourceLink}</p>
            </div>
            {expandedSetIndex === setIndex && (
              <div className={`p-4 border-t ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-100 border-gray-300'}`}>
                <div className="space-y-4">
                  {set.notecards.map((card, cardIndex) => (
                    <div key={cardIndex} className={`p-4 rounded-lg shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                      <h3 className={`text-lg font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{card.objective}</h3>
                      <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-800'}`}>{card.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))
      ) : (
        <p className={`text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No notecards found for the past 14 days.</p>
      )}
    </div>
  );
}
