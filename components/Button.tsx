import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

  const variantStyles = {
    primary: 'bg-[#B85328] hover:bg-[#A64821] text-white shadow-xs',
    secondary: 'bg-[#0F172A] hover:bg-[#1E293B] text-white shadow-xs',
    outline:
      'border border-[#E9E4D9] bg-white text-stone-700 hover:bg-stone-100/60',
    ghost: 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50',
  };

  const sizeStyles = {
    sm: 'text-xs px-3.5 py-1.5',
    md: 'text-xs sm:text-sm px-5 py-2.5',
    lg: 'text-sm sm:text-base px-6 py-3',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
