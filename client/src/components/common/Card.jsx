import React from 'react';

/**
 * Reusable accessible Card container component
 * Supports default glassmorphism, accent hero panels, and interactive cards with keyboard focus.
 */
const Card = ({
  children,
  variant = 'default',
  title,
  subtitle,
  headerRight,
  footer,
  onClick,
  className = '',
  role,
  ariaLabel,
  ...props
}) => {
  const isInteractive = !!onClick;

  const variantStyles = {
    default: 'glass-panel rounded-2xl border border-white/20 dark:border-gray-800/50 shadow-glass',
    accent: 'glass-panel-accent rounded-3xl border border-indigo-500/20 dark:border-indigo-500/10 shadow-glassAccent',
    interactive: 'glass-panel rounded-2xl border border-slate-200/50 dark:border-slate-800/50 hover:border-indigo-500/40 hover:shadow-cardHover cursor-pointer transition-all duration-200 hover:-translate-y-0.5',
    subtle: 'bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/40 dark:border-slate-800/40 rounded-xl'
  };

  const resolvedVariant = variantStyles[variant] || variantStyles.default;

  const handleKeyDown = (e) => {
    if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick(e);
    }
  };

  return (
    <div
      onClick={onClick}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      role={role || (isInteractive ? 'button' : undefined)}
      aria-label={ariaLabel}
      className={`p-5 sm:p-6 flex flex-col gap-4 ${resolvedVariant} ${
        isInteractive ? 'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900' : ''
      } ${className}`}
      {...props}
    >
      {(title || subtitle || headerRight) && (
        <div className="flex items-start justify-between gap-4 border-b border-slate-200/40 dark:border-slate-800/40 pb-3">
          <div className="flex flex-col gap-0.5">
            {title && (
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {subtitle}
              </p>
            )}
          </div>
          {headerRight && <div className="flex items-center gap-2">{headerRight}</div>}
        </div>
      )}

      <div className="flex-1">
        {children}
      </div>

      {footer && (
        <div className="border-t border-slate-200/40 dark:border-slate-800/40 pt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
