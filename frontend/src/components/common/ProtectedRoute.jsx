import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import LoadingSpinner from './LoadingSpinner';

export const getPortalRoute = (role) => {
  switch (role) {
    case 'admin':
    case 'manager':
    case 'cleaner_manager':
    case 'cleaner':
      return '/dashboard';
    case 'customer':
      return '/customer-portal';
    case 'agency_manager':
    case 'agency_bookkeeper':
    case 'agency_staff':
      return '/agency-portal';
    default:
      return '/dashboard';
  }
};

export const ProtectedRoute = ({ children, allowedRoles, redirectTo }) => {
  const { accessToken, role, isLoading } = useAuth();
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

  // If allowedRoles is defined, check permission
  if (allowedRoles && !allowedRoles.includes(role)) {
    const destination = redirectTo || getPortalRoute(role);
    return <Navigate to={destination} replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
