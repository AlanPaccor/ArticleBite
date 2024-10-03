import { db } from '../app/lib/firebase-config';
import { doc, getDoc } from 'firebase/firestore';
import * as admin from 'firebase-admin';

// Assuming you've initialized the admin SDK elsewhere in your server-side code
// If not, you'll need to initialize it with your service account credentials

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

async function clearOldNotes() {
    const now = new Date();
    const cutoffDate = new Date(now.setDate(now.getDate() - 14)); // 14 days ago

    console.log(`Current Time: ${now.toISOString()}`); // Log current time
    console.log(`Cutoff Date: ${cutoffDate.toISOString()}`); // Log cutoff date

    const firestore = admin.firestore();
    const notesRef = firestore.collection('notesHistory');
    const query = notesRef.where('createdAt', '<', cutoffDate);

    try {
        const snapshot = await query.get();
        console.log(`Found ${snapshot.size} notes older than 14 days.`); // Log the number of old notes

        if (snapshot.empty) {
            console.log('No old notes found.');
            return;
        }

        const batch = firestore.batch();
        let deletedCount = 0;

        snapshot.forEach((doc) => {
            const data = doc.data();
            console.log(`Note ID: ${doc.id}, CreatedAt: ${data.createdAt.toDate().toISOString()}`); // Log each note's timestamp
            batch.delete(doc.ref);
            deletedCount++;
        });

        await batch.commit();
        console.log(`${deletedCount} old notes deleted successfully.`);
    } catch (error) {
        console.error("Error clearing old notes:", error);
    }
}

// Export the function so it can be called from a server-side context
export { clearOldNotes };

// Remove the immediate invocation of clearOldNotes
// clearOldNotes().catch(error => console.error("Error running clearOldNotes:", error));