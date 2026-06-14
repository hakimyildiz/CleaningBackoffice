import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import LoadingSpinner from './LoadingSpinner';

export const ProtectedRoute = ({ children }) => {
  const { accessToken, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-light">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!accessToken) {
    // Redirect to login page and keep track of where the user was heading
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
