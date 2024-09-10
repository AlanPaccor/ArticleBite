import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import Landing from './Pages/Landing';
import Register from './Pages/Register';
import Login from './Pages/Login';
import UploadPage from './Pages/UploadPage';
import AuthRoute from './AuthRoute'; // Import the AuthRoute component
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import reportWebVitals from './reportWebVitals';

// Define the type for the AuthRoute props
interface AuthRouteProps {
  element: React.ElementType; // Use ElementType to allow components of various types
}

const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
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
}

reportWebVitals();
