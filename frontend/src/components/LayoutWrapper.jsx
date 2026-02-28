import React from 'react';
import { useLocation } from 'react-router-dom';

export default function LayoutWrapper({ children }) {
  const location = useLocation();
  
  // 🛠️ Adicionamos a verificação para rotas que começam com '/admin'
  const isFullWidth = location.pathname.includes('igent') || location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex justify-center bg-[#F8F9FE]">
      <div className={`min-h-screen relative overflow-x-hidden bg-[#F8F9FE] ${
        isFullWidth ? 'w-full max-w-none' : 'w-full max-w-[800px]'
      }`}>
        {children}
      </div>
    </div>
  );
}