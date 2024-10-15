'use client';

import React from 'react';
import Footer from "@/app/sections/Footer";
import { uploadArticle } from './uploadArticle';
import { SecondHeader } from "@/app/sections/SecondHeader";
import getConfig from 'next/config';

export default function ArticleGen() {
  const { publicRuntimeConfig } = getConfig();
  const apiUrl = publicRuntimeConfig.API_URL || 'http://localhost:3005';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      <UploadArticle apiUrl={apiUrl} />
      <Footer />
    </>
  );
}
