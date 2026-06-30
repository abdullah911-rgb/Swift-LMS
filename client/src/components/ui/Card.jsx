import React from 'react';

const Card = ({
  children,
  className = '',
  hover = true,
  onClick,
  ...props
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-slate-100 rounded-2xl soft-shadow p-6 
        ${hover ? 'card-hover' : ''} 
        ${onClick ? 'cursor-pointer' : ''} 
        ${className}`
      }
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
