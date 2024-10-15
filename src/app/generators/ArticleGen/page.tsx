'use client';

import React, { useState, useEffect } from 'react';
import Footer from "@/app/sections/Footer";
import { uploadArticle } from './uploadArticle';
import { SecondHeader } from "@/app/sections/SecondHeader";
import { auth } from '@/firebase/firebaseConfig';
import { User } from 'firebase/auth';

export default function ArticleGen() {
  const [articleData, setArticleData] = useState({});
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (auth) {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        setUser(user);
      });

      return () => unsubscribe();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      console.error('User not authenticated');
      return;
    }
    try {
      const articleId = await uploadArticle(articleData);
      console.log('Article uploaded successfully with ID:', articleId);
      // Handle success (e.g., show a success message, reset form, etc.)
    } catch (error) {
      console.error('Failed to upload article:', error);
      // Handle error (e.g., show error message to user)
    }
  };

  return (
    <>
      <SecondHeader />
      {user ? (
        <form onSubmit={handleSubmit}>
          {/* Add your form fields here */}
          <button type="submit">Upload Article</button>
        </form>
      ) : (
        <p>Please log in to upload articles.</p>
      )}
      <Footer />
    </>
  );
}
