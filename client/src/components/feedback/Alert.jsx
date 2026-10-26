import React from 'react';
import { FiAlertCircle, FiAlertTriangle, FiCheckCircle, FiInfo, FiX } from 'react-icons/fi';

/**
 * Reusable accessible Alert component for notifications, errors, warnings, and success messages
 */
const Alert = ({
  type = 'info',
  title,
  message,
  children,
  onClose,
  action,
  className = ''
}) => {
  const isErrorOrWarning = type === 'error' || type === 'danger' || type === 'warning';
  const role = isErrorOrWarning ? 'alert' : 'status';

  const typeConfig = {
    error: {
      icon: FiAlertCircle,
      container: 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400',
      iconColor: 'text-rose-500'
    },
    danger: {
      icon: FiAlertCircle,
      container: 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400',
      iconColor: 'text-rose-500'
    },
    warning: {
      icon: FiAlertTriangle,
      container: 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400',
      iconColor: 'text-amber-500'
    },
    success: {
      icon: FiCheckCircle,
      container: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400',
      iconColor: 'text-emerald-500'
    },
    info: {
      icon: FiInfo,
      container: 'bg-sky-500/10 border-sky-500/20 text-sky-700 dark:text-sky-400',
      iconColor: 'text-sky-500'
    }
  };

  const currentConfig = typeConfig[type] || typeConfig.info;
  const Icon = currentConfig.icon;

  return (
    <div
      role={role}
      className={`p-4 rounded-2xl border flex items-start gap-3 transition-all ${currentConfig.container} ${className}`}
    >
      <div className={`mt-0.5 flex-shrink-0 ${currentConfig.iconColor}`}>
        <Icon size={18} aria-hidden="true" />
      </div>

      <div className="flex-1 text-xs leading-relaxed">
        {title && (
          <h4 className="font-bold text-sm tracking-tight mb-0.5">
            {title}
          </h4>
        )}
        {message && <p>{message}</p>}
        {children}
        {action && (
          <div className="mt-2.5">
            {action}
          </div>
        )}
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss alert"
          className="flex-shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
        >
          <FiX size={15} aria-hidden="true" />
        </button>
      )}
    </div>
  );
};

export default Alert;
