import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const ProtectedRoute = ({ allowedRoles }) => {
  const { user, profile, loading } = useAuth();

  if (loading || (user && !profile)) {
    return <div className="min-h-screen flex items-center justify-center dark:bg-slate-900 dark:text-slate-300">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
