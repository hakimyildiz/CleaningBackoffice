import React from 'react';

export const Select = ({
  options = [],
  value = '',
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  className = '',
  ...props
}) => {
  return (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:border-brand-accent focus:ring-brand-accent transition-all duration-150 shadow-sm cursor-pointer ${className}`}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
};

export default Select;
