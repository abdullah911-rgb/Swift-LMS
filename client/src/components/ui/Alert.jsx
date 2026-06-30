import React from 'react';
import { 
  IoInformationCircleOutline, 
  IoCheckmarkCircleOutline, 
  IoWarningOutline, 
  IoAlertCircleOutline 
} from 'react-icons/io5';

const Alert = ({
  children,
  type = 'info',
  className = '',
}) => {
  const styles = {
    info: 'bg-blue-50 text-blue-800 border-blue-100',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-100',
    warning: 'bg-amber-50 text-amber-800 border-amber-100',
    danger: 'bg-red-50 text-red-800 border-red-100',
  };

  const icons = {
    info: <IoInformationCircleOutline className="w-5 h-5 flex-shrink-0" />,
    success: <IoCheckmarkCircleOutline className="w-5 h-5 flex-shrink-0" />,
    warning: <IoWarningOutline className="w-5 h-5 flex-shrink-0" />,
    danger: <IoAlertCircleOutline className="w-5 h-5 flex-shrink-0" />,
  };

  return (
    <div className={`flex gap-3 p-4 rounded-xl border font-sans text-sm ${styles[type]} ${className}`}>
      {icons[type]}
      <div className="flex-1 leading-relaxed font-medium">{children}</div>
    </div>
  );
};

export default Alert;
