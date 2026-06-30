import React from 'react';

const Spinner = ({
  size = 'md',
  color = 'primary',
  className = '',
}) => {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  };

  const colors = {
    primary: 'border-primary-600',
    white: 'border-white',
    slate: 'border-slate-400',
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`animate-spin rounded-full border-t-transparent ${sizes[size]} ${colors[color]}`}
        role="status"
        aria-label="loading"
      ></div>
    </div>
  );
};

export default Spinner;
