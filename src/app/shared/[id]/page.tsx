'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface Notecard {
  objective: string;
  explanation: string;
}

interface NoteCardSet {
  id: string;
  notecards: Notecard[];
  userEmail: string;
  createdAt: string;
  sourceLink: string;
}

export default function SharedNoteCard() {
  const { id } = useParams();
  const [noteCardSet, setNoteCardSet] = useState<NoteCardSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchNoteCard() {
      try {
        const response = await fetch(`/api/notecards/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch note card');
        }
        const data = await response.json();
        setNoteCardSet(data);
      } catch (err) {
        setError('Error fetching note card');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchNoteCard();
    }
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!noteCardSet) return <div>Note card set not found</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Shared Note Cards</h1>
      <p>Source: <a href={noteCardSet.sourceLink} className="text-blue-500 hover:underline">{noteCardSet.sourceLink}</a></p>
      <p>Created: {new Date(noteCardSet.createdAt).toLocaleString()}</p>
      <div className="mt-4">
        {noteCardSet.notecards.map((card, index) => (
          <div key={index} className="mb-4 p-4 border rounded">
            <h2 className="font-bold">Question:</h2>
            <p>{card.objective}</p>
            <h2 className="font-bold mt-2">Answer:</h2>
            <p>{card.explanation}</p>
          </div>
        ))}
      </div>
    </div>
  );
}