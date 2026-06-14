import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

export const SearchBar = ({
  value = '',
  onChange,
  placeholder = 'Search...'
}) => {
  const [localValue, setLocalValue] = useState(value);
  const timeoutRef = useRef(null);

  // Sync local state with parent prop updates
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e) => {
    const val = e.target.value;
    setLocalValue(val);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      onChange(val);
    }, 400); // 400ms debounce
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative w-full max-w-xs">
      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
        <Search className="w-4 h-4" />
      </span>
      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-800 placeholder-slate-450 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all duration-150 shadow-sm"
      />
    </div>
  );
};

export default SearchBar;
