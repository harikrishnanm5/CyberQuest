import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  isLoading, 
  className = '',
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center font-mono font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-cyber-primary text-cyber-black hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(0,255,157,0.4)] border border-transparent",
    secondary: "bg-cyber-secondary text-cyber-black hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(0,208,255,0.4)] border border-transparent",
    outline: "bg-transparent border border-cyber-primary text-cyber-primary hover:bg-cyber-primary/10",
    ghost: "bg-transparent text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs rounded-sm",
    md: "px-6 py-2.5 text-sm rounded-sm",
    lg: "px-8 py-4 text-base rounded-md",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          PROCESSING
        </span>
      ) : children}
    </button>
  );
};