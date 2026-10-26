import React, { useEffect, useRef } from 'react';
import { FiX } from 'react-icons/fi';

/**
 * Reusable accessible Modal dialog component
 * Manages body scroll-lock, escape-key listener, backdrop dismissal, and ARIA dialog semantics.
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
  className = '',
  showCloseButton = true
}) => {
  const modalRef = useRef(null);

  // Handle ESC key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is active
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  const resolvedSize = sizeClasses[size] || sizeClasses.md;

  const handleBackdropClick = (e) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose?.();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-dialog-title' : undefined}
        className={`w-full ${resolvedSize} glass-panel rounded-3xl shadow-2xl border border-white/20 dark:border-gray-800/60 overflow-hidden flex flex-col max-h-[90vh] ${className}`}
      >
        {/* MODAL HEADER */}
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between p-6 border-b border-slate-200/50 dark:border-slate-800/50">
            <div>
              {title && (
                <h2
                  id="modal-dialog-title"
                  className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight"
                >
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {subtitle}
                </p>
              )}
            </div>

            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ml-4"
              >
                <FiX size={18} aria-hidden="true" />
              </button>
            )}
          </div>
        )}

        {/* MODAL BODY */}
        <div className="p-6 overflow-y-auto flex-1">
          {children}
        </div>

        {/* MODAL FOOTER */}
        {footer && (
          <div className="p-4 sm:p-6 border-t border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
