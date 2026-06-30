import React from 'react';

const Badge = ({
  children,
  variant = 'primary',
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border';

  const variants = {
    primary: 'bg-primary-50 text-primary-700 border-primary-100',
    secondary: 'bg-slate-50 text-slate-700 border-slate-100',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    danger: 'bg-red-50 text-red-700 border-red-100',
    warning: 'bg-amber-50 text-amber-700 border-amber-100',
    info: 'bg-sky-50 text-sky-700 border-sky-100',
  };

  return (
    <span
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
