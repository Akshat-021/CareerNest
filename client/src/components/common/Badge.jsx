import React from 'react';

/**
 * Reusable accessible Badge component with semantic variants, optional status dot, and icons.
 */
const Badge = ({
  children,
  variant = 'primary',
  size = 'sm',
  icon: Icon,
  dot = false,
  className = ''
}) => {
  const sizeStyles = {
    xs: 'text-[9px] px-2 py-0.5 rounded gap-1',
    sm: 'text-[10px] px-2.5 py-0.5 rounded-full gap-1.5',
    md: 'text-xs px-3 py-1 rounded-full gap-2'
  };

  const variantStyles = {
    primary: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20',
    success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20',
    danger: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20',
    info: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20',
    neutral: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
  };

  const dotColors = {
    primary: 'bg-indigo-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-sky-500',
    neutral: 'bg-slate-400'
  };

  const resolvedSize = sizeStyles[size] || sizeStyles.sm;
  const resolvedVariant = variantStyles[variant] || variantStyles.primary;
  const resolvedDotColor = dotColors[variant] || dotColors.primary;

  return (
    <span
      className={`inline-flex items-center font-semibold tracking-wide uppercase ${resolvedSize} ${resolvedVariant} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${resolvedDotColor} animate-pulse`}
          aria-hidden="true"
        />
      )}
      {Icon && (
        typeof Icon === 'function' ? (
          <Icon size={size === 'xs' ? 10 : size === 'md' ? 14 : 12} aria-hidden="true" />
        ) : (
          Icon
        )
      )}
      <span>{children}</span>
    </span>
  );
};

export default Badge;
