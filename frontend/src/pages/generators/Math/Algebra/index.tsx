import axios from 'axios';

// Inside your handleSubmit function or wherever you're making the API call
const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  
  // Create a new FormData object
  const formData = new FormData();
  
  // Append the necessary data to the formData object
  formData.append('uploadType', uploadType);
  if (file) {
    formData.append('file', file);
  }
  formData.append('email', user.email);
  formData.append('questionCount', questionCount.toString());
  formData.append('difficulty', difficulty);
  formData.append('questionType', selectedQuestionType);
  if (uploadType === 'youtube' || uploadType === 'url') {
    formData.append('url', input);
  }

  try {
    // Make the API call
    const response = await axios.post(`/api/process-file`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // Handle the response
    console.log(response.data);
    // Update your state or do something with the response data
  } catch (error) {
    console.error('Error in API call:', error);
    // Handle the error (e.g., show an error message to the user)
  }
};
