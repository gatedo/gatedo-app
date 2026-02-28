import React from 'react';
import { useLocation } from 'react-router-dom';

export default function LayoutWrapper({ children }) {
  const location = useLocation();
  const isFullWidth = location.pathname.includes('igent');

  return (
    <div className="min-h-screen flex justify-center">
      <div className={`min-h-screen relative overflow-x-hidden bg-[#F8F9FE] ${
        isFullWidth ? 'w-full max-w-none' : 'w-full max-w-[800px]'
      }`}>
        {children}
      </div>
    </div>
  );
}