import React from 'react';
import LoadingSpinner from './LoadingSpinner';

export const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  onClick,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-brand-accent hover:bg-brand-hover text-brand-dark focus:ring-brand-accent shadow-md shadow-brand-accent/10 hover:shadow-lg hover:shadow-brand-accent/20 active:scale-[0.99]',
    secondary: 'bg-brand-primary hover:bg-brand-primary/90 text-white focus:ring-brand-primary active:scale-[0.99]',
    outline: 'border border-slate-300 hover:bg-slate-50 text-slate-700 focus:ring-slate-500 active:scale-[0.99]',
    danger: 'bg-red-650 hover:bg-red-700 text-white focus:ring-red-500 active:scale-[0.99]'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <button
      type={type}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      disabled={disabled || isLoading}
      onClick={onClick}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <LoadingSpinner size="sm" color={variant === 'primary' ? 'navy' : 'white'} />
          <span>Please wait...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
