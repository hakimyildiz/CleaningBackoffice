import React from 'react';

export const FormField = ({
  label,
  error,
  required = false,
  id,
  children,
  type = 'text',
  placeholder = '',
  disabled = false,
  value,
  onChange,
  ...props
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1 w-full text-left">
      {label && (
        <label htmlFor={inputId} className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-0.5">
          {label}
          {required && <span className="text-red-500 font-bold">*</span>}
        </label>
      )}

      {children ? (
        React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, {
              id: inputId,
              className: `${child.props.className || ''} ${
                error 
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                  : 'border-slate-200 focus:border-brand-accent focus:ring-brand-accent'
              }`
            });
          }
          return child;
        })
      ) : (
        <input
          id={inputId}
          type={type}
          placeholder={placeholder}
          value={value ?? ''}
          onChange={onChange}
          disabled={disabled}
          className={`w-full bg-white border rounded-lg px-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 transition-all duration-155 ${
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
              : 'border-slate-200 focus:border-brand-accent focus:ring-brand-accent'
          }`}
          {...props}
        />
      )}

      {error && (
        <span className="text-xs font-semibold text-red-500 mt-0.5">
          {error}
        </span>
      )}
    </div>
  );
};

export default FormField;
