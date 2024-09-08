import React, { useState } from 'react';
import '../CSS/UploadPage.css';

export default function UploadPage() {
  const [link, setLink] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    // Handle link submission logic here
    console.log('Link submitted:', link);
  };

  return (
    <div className='uPageContainer'>
      <div className='uPageTitleContainer'>
        <h1>Upload A Link To Get Your Generated Notes!</h1>
      </div>
      <div className='formContainer'>
        <form onSubmit={handleSubmit}>
          <div className='inputField'>
            <label htmlFor='link'>Page Link</label>
            <input
              type='url'
              id='link'
              placeholder='Enter the link to the page'
              value={link}
              onChange={(e) => setLink(e.target.value)}
              required
            />
          </div>
          <button type='submit' className='submitButton'>
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}
