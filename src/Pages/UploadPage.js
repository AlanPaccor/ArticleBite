import React, { useState } from 'react';
import axios from 'axios';
import '../CSS/UploadPage.css';

export default function UploadPage() {
  const [link, setLink] = useState('');
  const [notecards, setNotecards] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (event) => {
    setLink(event.target.value);
  };

  const parseNotecards = (text) => {
    const cards = [];
    const objectiveRegex = /objective(\d+)={([^}]+)}/g;
    const answerRegex = /answer(\d+)={([^}]+)}/g;

    const objectives = {};
    const answers = {};

    let match;

    // Extract objectives
    while ((match = objectiveRegex.exec(text)) !== null) {
      objectives[match[1]] = match[2].trim();
    }

    // Extract answers
    while ((match = answerRegex.exec(text)) !== null) {
      answers[match[1]] = match[2].trim();
    }

    // Create notecards
    Object.keys(objectives).forEach(key => {
      if (answers[key]) {
        cards.push({
          objective: objectives[key],
          explanation: answers[key]
        });
      }
    });

    return cards;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');
    setNotecards([]);

    try {
      const response = await axios.post('http://localhost:3001/scrape', { url: link });
      const summarizedText = response.data.summarizedText;
      
      if (summarizedText) {
        const cards = parseNotecards(summarizedText);
        if (cards.length > 0) {
          setNotecards(cards);
        } else {
          setError('No valid notecards found in the response.');
        }
      } else {
        setError('No summarized text received from the server.');
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
      setError('Failed to fetch notes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='uPageContainer'>
      <div className='uPageTitleContainer'>
        <h1>Upload A Link To Get Your Generated Notes!</h1>
      </div>
      <div>
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
