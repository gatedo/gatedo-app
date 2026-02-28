import React, { useContext, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) return null; 

  if (!user) {
    // Se não estiver logado, manda para o login e limpa qualquer estado residual
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}