import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import Landing from './Pages/Landing';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import reportWebVitals from './reportWebVitals';
import Register from './Pages/Register';
import Login from './Pages/Login';
import UploadPage from './Pages/UploadPage';
import AuthRoute from './AuthRoute'; // Import the AuthRoute component

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route 
          path="/uploadlink" 
          element={<AuthRoute element={UploadPage} />} 
        />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

reportWebVitals();
