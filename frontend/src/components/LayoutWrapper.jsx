import React from 'react';
import { useLocation } from 'react-router-dom';

const APP_DESKTOP_WIDTH = '920px';

export default function LayoutWrapper({ children }) {
  const { pathname } = useLocation();
  const isImmersiveRoute =
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/auth/register') ||
    pathname.startsWith('/auth/login') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/verify-email') ||
    pathname.includes('igent') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/studio') ||
    pathname.startsWith('/creative') ||
    pathname.startsWith('/memorial') ||
    pathname.startsWith('/welcome') ||
    pathname.startsWith('/obrigado') ||
    pathname.startsWith('/embaixadoras');

  return (
    <div className="min-h-screen flex justify-center bg-[var(--gatedo-light-bg)]">
      <div
        className={`min-h-screen relative overflow-x-hidden bg-[var(--gatedo-light-bg)] ${
          isImmersiveRoute ? 'w-full max-w-none' : 'w-full'
        }`}
        style={isImmersiveRoute ? undefined : { maxWidth: APP_DESKTOP_WIDTH }}
      >
        {children}
      </div>
    </div>
  );
}
