import React from 'react';

/**
 * Reusable accessible Loading Spinner component with sr-only announcement
 */
const Spinner = ({
  size = 'md',
  variant = 'primary',
  label = 'Loading content...',
  className = ''
}) => {
  const sizeStyles = {
    xs: 'w-3 h-3 border',
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-4',
    xl: 'w-12 h-12 border-4'
  };

  const variantStyles = {
    primary: 'border-indigo-500 border-t-transparent',
    white: 'border-white border-t-transparent',
    muted: 'border-slate-400 dark:border-slate-600 border-t-transparent',
    success: 'border-emerald-500 border-t-transparent'
  };

  const resolvedSize = sizeStyles[size] || sizeStyles.md;
  const resolvedVariant = variantStyles[variant] || variantStyles.primary;

  return (
    <div role="status" className="inline-flex items-center justify-center">
      <div
        className={`rounded-full animate-spin ${resolvedSize} ${resolvedVariant} ${className}`}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </div>
  );
};

export default Spinner;
