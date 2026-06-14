import React from 'react';

export const LoadingSpinner = ({ size = 'md', color = 'teal' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-[3px]',
    lg: 'w-12 h-12 border-4'
  };

  const colorClasses = {
    teal: 'border-brand-accent/20 border-t-brand-accent',
    white: 'border-white/20 border-t-white',
    navy: 'border-brand-primary/20 border-t-brand-primary'
  };

  return (
    <div className="flex items-center justify-center">
      <div
        className={`rounded-full animate-spin ${sizeClasses[size] || sizeClasses.md} ${colorClasses[color] || colorClasses.teal}`}
        role="status"
        aria-label="loading"
      />
    </div>
  );
};

export default LoadingSpinner;
