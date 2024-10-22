import React, { useState, FormEvent, ChangeEvent } from 'react';
import axios from 'axios';
import { User } from 'firebase/auth';
import { useRouter } from 'next/router';

interface UploadAlgebraProps {
  user: User | null;
}

const UploadAlgebra: React.FC<UploadAlgebraProps> = ({ user }) => {
  const [uploadType, setUploadType] = useState<string>('png');
  const [file, setFile] = useState<File | null>(null);
  const [input, setInput] = useState<string>('');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<string>('Easy');
  const [selectedQuestionType, setSelectedQuestionType] = useState<string>('true/false');
  const router = useRouter();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setInput(event.target.value);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!user) {
      console.error('User not logged in');
      router.push('/login');
      return;
    }

    const formData = new FormData();
    
    formData.append('uploadType', uploadType);
    if (file) {
      formData.append('file', file);
    }
    formData.append('email', user.email || '');
    formData.append('questionCount', questionCount.toString());
    formData.append('difficulty', difficulty);
    formData.append('questionType', selectedQuestionType);
    if (uploadType === 'youtube' || uploadType === 'url') {
      formData.append('url', input);
    }

    try {
      let response;
      
      if (uploadType === 'url') {
        response = await axios.post('/api/scrape', {
          url: input,
          email: user.email,
          questionCount,
          difficulty,
          questionType: selectedQuestionType
        });
      } else if (uploadType === 'png') {
        response = await axios.post('/api/process-image', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        response = await axios.post('/api/process-file', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      console.log(response.data);
      // Handle the response (e.g., update state, show results)
    } catch (error: any) {
      console.error('Error in API call:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      // Handle the error (e.g., show an error message to the user)
    }
  };

  // Render your form and other UI elements here
  return (
    <form onSubmit={handleSubmit}>
      {/* Add your form fields here */}
      <button type="submit">Submit</button>
    </form>
  );
};

export default UploadAlgebra;
