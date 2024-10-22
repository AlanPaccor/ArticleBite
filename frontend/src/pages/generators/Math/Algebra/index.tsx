import axios from 'axios';

// Replace the existing API call with this
const response = await axios.post(`/api/process-file`, formData, {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});
