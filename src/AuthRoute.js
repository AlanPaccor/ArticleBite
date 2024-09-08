import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, getAuth } from 'firebase/auth';
import { useState, useEffect } from 'react';

const AuthRoute = ({ element: Element }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null means loading
  const location = useLocation();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    });

    return () => unsubscribe();
  }, [auth]);

  if (isAuthenticated === null) {
    // Loading state or wait for Firebase to initialize
    return <div>Loading...</div>;
  }

  return isAuthenticated ? (
    <Element />
  ) : (
    <Navigate to="/login" state={{ from: location }} />
  );
};

export default AuthRoute;
