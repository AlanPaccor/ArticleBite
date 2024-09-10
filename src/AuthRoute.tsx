import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, getAuth, User } from 'firebase/auth';

interface AuthRouteProps {
  element: React.ComponentType; // Component type for the route
}

const AuthRoute: React.FC<AuthRouteProps> = ({ element: Element }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null); // null means loading
  const location = useLocation();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
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
