import { NextResponse } from 'next/server';
import { getNoteCardById } from '@/lib/database';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  
  if (!id) {
    return NextResponse.json({ error: 'No ID provided' }, { status: 400 });
  }

  try {
    const noteCard = await getNoteCardById(id);

    if (!noteCard) {
      return NextResponse.json({ error: 'Note card not found' }, { status: 404 });
    }

    return NextResponse.json(noteCard);
  } catch (error) {
    console.error('Error fetching note card:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}