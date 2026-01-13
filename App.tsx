import React, { useState, useEffect, useRef, useCallback } from 'react';
import { HashRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import {
  Users, Plus, LogOut, Settings, Music, MessageCircle,
  Gamepad2, Send, RefreshCw, Copy, Check, Bot,
  Sun, Moon, Heart, Zap, DoorOpen, Reply, X, Loader2
} from 'lucide-react';

import { User, DuoSpace, Message, Song } from './types';
import * as API from './services/storage';
import * as Gemini from './services/geminiService';

/* ======================================================
   INLINE UI COMPONENTS (REPLACED components/Common)
====================================================== */

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  isLoading?: boolean;
};

const Button: React.FC<ButtonProps> = ({
  children,
  className = '',
  variant = 'primary',
  isLoading,
  disabled,
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center gap-2 font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-violet-600 text-white hover:bg-violet-700',
    secondary: 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white',
    ghost: 'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800',
    danger: 'bg-rose-600 text-white hover:bg-rose-700'
  };

  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {isLoading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
};

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

const Input: React.FC<InputProps> = ({
  label,
  error,
  className = '',
  ...props
}) => (
  <div className="flex flex-col gap-1 w-full">
    {label && (
      <label className="text-xs font-bold text-slate-500">{label}</label>
    )}
    <input
      {...props}
      className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-slate-800 
        border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 
        focus:ring-violet-500 ${className}`}
    />
    {error && <span className="text-xs text-rose-500 font-bold">{error}</span>}
  </div>
);

const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div
    {...props}
    className={`p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-lg ${className}`}
  >
    {children}
  </div>
);

const Badge: React.FC<{ children: React.ReactNode; color?: string }> = ({
  children,
  color = 'bg-slate-100 text-slate-700'
}) => (
  <span className={`inline-block px-3 py-1 rounded-full text-xs font-black ${color}`}>
    {children}
  </span>
);

/* ======================================================
   ICON HELPERS
====================================================== */

const ArrowRightIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

/* ======================================================
   APP (UNCHANGED BELOW)
====================================================== */

export default function App() {
  const [session, setSession] = useState(API.getSession());

  useEffect(() => {
    const handler = () => setSession(API.getSession());
    window.addEventListener('duospace-session-update', handler);
    return () => window.removeEventListener('duospace-session-update', handler);
  }, []);

  useEffect(() => {
    const isDark = session?.user.settings.theme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
  }, [session]);

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={session ? <Dashboard /> : <AuthView onLogin={() => setSession(API.getSession())} />} />
        <Route path="/space/:id" element={<SpaceView />} />
      </Routes>
    </HashRouter>
  );
}
