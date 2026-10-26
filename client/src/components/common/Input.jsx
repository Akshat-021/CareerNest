import React, { forwardRef } from 'react';

/**
 * Reusable accessible Input component with label, error, helper text, and icon support.
 * Uses React.forwardRef for seamless integration with react-hook-form.
 */
const Input = forwardRef(({
  id,
  name,
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  helperText,
  icon: Icon,
  iconRight: IconRight,
  onRightIconClick,
  disabled = false,
  required = false,
  className = '',
  wrapperClassName = '',
  autoComplete,
  ...props
}, ref) => {
  const generatedId = id || (name ? `input-${name}` : undefined);
  const errorId = generatedId ? `${generatedId}-error` : undefined;
  const helperId = generatedId ? `${generatedId}-helper` : undefined;

  const describedBy = [
    error && errorId,
    helperText && helperId
  ].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`flex flex-col gap-1.5 w-full ${wrapperClassName}`}>
      {label && (
        <label
          htmlFor={generatedId}
          className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between"
        >
          <span>
            {label}
            {required && <span className="text-rose-500 ml-1" aria-hidden="true">*</span>}
          </span>
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 pointer-events-none text-slate-400 dark:text-slate-500 flex items-center justify-center" aria-hidden="true">
            {typeof Icon === 'function' ? <Icon size={16} /> : Icon}
          </div>
        )}

        <input
          ref={ref}
          id={generatedId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={`w-full rounded-xl bg-white/70 dark:bg-gray-900/50 backdrop-blur-sm border transition-all duration-200 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none ${
            Icon ? 'pl-10' : 'pl-4'
          } ${
            IconRight ? 'pr-10' : 'pr-4'
          } py-2.5 ${
            error
              ? 'border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
              : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
          } disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
          {...props}
        />

        {IconRight && (
          <button
            type="button"
            onClick={onRightIconClick}
            disabled={disabled}
            className="absolute right-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none focus:text-indigo-500 transition-colors"
            tabIndex={onRightIconClick ? 0 : -1}
            aria-hidden={!onRightIconClick}
          >
            {typeof IconRight === 'function' ? <IconRight size={16} /> : IconRight}
          </button>
        )}
      </div>

      {error && (
        <p
          id={errorId}
          role="alert"
          className="text-xs text-rose-500 dark:text-rose-400 font-medium mt-0.5 flex items-center gap-1"
        >
          {error}
        </p>
      )}

      {helperText && !error && (
        <p
          id={helperId}
          className="text-xs text-slate-500 dark:text-slate-400 mt-0.5"
        >
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
