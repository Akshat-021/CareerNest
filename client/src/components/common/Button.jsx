import React from 'react';

/**
 * Reusable accessible Button component for CareerNest
 * Supports multiple variants, sizes, icon placements, loading and disabled states
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  isLoading = false,
  loadingText,
  icon: Icon,
  iconRight: IconRight,
  disabled = false,
  onClick,
  className = '',
  ariaLabel,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 active:scale-95 select-none disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none disabled:active:scale-100';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5',
    md: 'text-sm px-4 py-2.5 rounded-xl gap-2',
    lg: 'text-base px-6 py-3 rounded-2xl gap-2.5'
  };

  const variantStyles = {
    primary: 'bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-md hover:shadow-lg shadow-indigo-500/20',
    secondary: 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800/70 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-200/60 dark:border-gray-700/60 shadow-sm',
    outline: 'bg-transparent hover:bg-indigo-500/10 border border-indigo-500/40 text-indigo-600 dark:text-indigo-400 font-semibold',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/20',
    ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800/60 text-gray-700 dark:text-gray-300'
  };

  const resolvedSize = sizeStyles[size] || sizeStyles.md;
  const resolvedVariant = variantStyles[variant] || variantStyles.primary;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      aria-disabled={disabled || isLoading}
      aria-busy={isLoading}
      aria-label={ariaLabel}
      className={`${baseStyles} ${resolvedSize} ${resolvedVariant} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <span
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block"
            aria-hidden="true"
          />
          <span>{loadingText || children}</span>
        </>
      ) : (
        <>
          {Icon && (
            typeof Icon === 'function' ? (
              <Icon size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} aria-hidden="true" />
            ) : (
              Icon
            )
          )}
          {children}
          {IconRight && (
            typeof IconRight === 'function' ? (
              <IconRight size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} aria-hidden="true" />
            ) : (
              IconRight
            )
          )}
        </>
      )}
    </button>
  );
};

export default Button;
