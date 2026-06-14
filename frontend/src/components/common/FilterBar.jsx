import React from 'react';

export const FilterBar = ({ children }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm mb-6">
      {children}
    </div>
  );
};

export default FilterBar;
