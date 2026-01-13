import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, variant = 'primary', isLoading, className = '', ...props 
}) => {
  const base = "px-6 py-3.5 rounded-2xl font-bold tracking-wide transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70 disabled:active:scale-100 shadow-md hover:shadow-lg";
  
  const variants = {
    primary: "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:brightness-110 border border-transparent",
    secondary: "bg-white/80 dark:bg-white/10 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-white/20 border border-slate-200 dark:border-white/10 backdrop-blur-sm",
    ghost: "bg-transparent text-slate-500 hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-300 shadow-none hover:bg-violet-50 dark:hover:bg-violet-900/20",
    danger: "bg-gradient-to-r from-red-500 to-pink-600 text-white hover:brightness-110",
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} disabled={isLoading || props.disabled} {...props}>
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => (
  <div className="flex flex-col gap-1.5 w-full">
    <div className="flex justify-between px-1">
      {label && <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</label>}
      {error && <span className="text-xs font-bold text-rose-500 animate-pulse">{error}</span>}
    </div>
    <input 
      className={`px-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-100 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 transition-all dark:bg-slate-900/50 dark:border-slate-800 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-violet-600 dark:focus:ring-violet-900/30 ${error ? '!border-rose-300 focus:!ring-rose-100' : ''} ${className}`}
      {...props} 
    />
  </div>
);

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`glass rounded-[2rem] p-6 shadow-xl border border-white/50 dark:border-white/5 ${className}`}>
    {children}
  </div>
);

export const Badge: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' }) => (
  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest shadow-sm ${color}`}>
    {children}
  </span>
);
