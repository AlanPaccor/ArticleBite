import { db } from '../../../firebase/firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';

export async function uploadArticle(articleData: any) {
  try {
    const docRef = await addDoc(collection(db, 'articles'), articleData);
    console.log('Document written with ID: ', docRef.id);
    return docRef.id;
  } catch (e) {
    console.error('Error adding document: ', e);
    throw e;
  }
}
