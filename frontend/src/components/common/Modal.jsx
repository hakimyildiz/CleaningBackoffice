import React from 'react';
import Button from './Button';
import { X } from 'lucide-react';

export const Modal = ({
  isOpen = false,
  onClose,
  title,
  children,
  onConfirm,
  confirmText = 'Confirm',
  confirmVariant = 'primary',
  isLoading = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden transform transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-800 leading-snug">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 text-sm text-slate-600 leading-relaxed bg-white">{children}</div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 font-bold text-slate-700 bg-white"
          >
            Cancel
          </Button>
          {onConfirm && (
            <Button
              variant={confirmVariant}
              onClick={onConfirm}
              isLoading={isLoading}
              className="px-4 font-bold"
            >
              {confirmText}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
