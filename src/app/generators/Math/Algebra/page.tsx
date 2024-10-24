'use client';

import React, { useState } from 'react';
import Footer from "@/app/sections/Footer";
import UploadAlgebra from "./uploadAlgebra";
import { SecondHeader } from "@/app/sections/SecondHeader";

const AlgebraGenerator: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState('');
  const [prompt, setPrompt] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/generate-algebra`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: prompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate algebra content');
      }

      const data = await response.json();
      setGeneratedContent(data.content);
    } catch (err) {
      setError('An error occurred while generating content. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SecondHeader />
      <UploadAlgebra />
      <form onSubmit={handleSubmit}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your algebra prompt here"
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Generating...' : 'Generate Algebra Content'}
        </button>
      </form>
      {error && <p className="error">{error}</p>}
      {generatedContent && (
        <div>
          <h2>Generated Content:</h2>
          <pre>{generatedContent}</pre>
        </div>
      )}
      <Footer />
    </>
  );
};

export default AlgebraGenerator;
