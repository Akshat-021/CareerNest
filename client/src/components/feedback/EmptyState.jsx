import React from 'react';
import { FiInbox } from 'react-icons/fi';

/**
 * Reusable accessible EmptyState component for empty catalogs, search results, or zero-item feeds
 */
const EmptyState = ({
  icon: Icon = FiInbox,
  title = 'No items found',
  description,
  action,
  className = ''
}) => {
  return (
    <div
      role="region"
      aria-label={title}
      className={`glass-panel rounded-3xl p-8 sm:p-12 flex flex-col items-center justify-center text-center gap-3 border border-slate-200/50 dark:border-slate-800/50 ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 flex items-center justify-center mb-1">
        {typeof Icon === 'function' ? (
          <Icon size={28} aria-hidden="true" />
        ) : typeof Icon === 'string' && Icon.length <= 4 ? (
          <span className="text-2xl" aria-hidden="true">{Icon}</span>
        ) : (
          Icon
        )}
      </div>

      <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 tracking-tight">
        {title}
      </h3>

      {description && (
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
          {description}
        </p>
      )}

      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
