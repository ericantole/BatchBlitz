import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'glass' | 'neon';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  className = '',
  ...props 
}) => {
  const baseClasses = "inline-flex items-center justify-center font-medium tracking-wide transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed rounded-sm active:scale-[0.98]";
  
  const variants = {
    primary: "bg-ink-main text-white shadow-card hover:shadow-lg hover:-translate-y-0.5 border border-transparent",
    secondary: "bg-white text-ink-main shadow-card hover:shadow-lg border border-white/50",
    glass: "bg-white/40 backdrop-blur-sm text-ink-main border border-white/40 shadow-card hover:bg-white/60",
    neon: "bg-accent-gold text-white shadow-card hover:shadow-lg hover:-translate-y-0.5"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-6 py-2.5 text-sm",
    lg: "px-8 py-3 text-base",
    xl: "px-10 py-4 text-lg"
  };

  return (
    <button 
      className={`
        ${baseClasses} 
        ${variants[variant]} 
        ${sizes[size]} 
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};