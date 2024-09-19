import { db } from '../app/lib/firebase-config';
import { doc, getDoc } from 'firebase/firestore';

export async function getNoteCardById(id: string) {
  try {
    const docRef = doc(db, 'notesHistory', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        notecards: data.notecards,
        userEmail: data.userEmail,
        createdAt: data.createdAt.toDate().toISOString(),
        sourceLink: data.sourceLink
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching note card:", error);
    throw error;
  }
}