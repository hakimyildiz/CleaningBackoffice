import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const Pagination = ({
  page = 1,
  totalPages = 1,
  limit = 20,
  total = 0,
  onPageChange
}) => {
  if (total === 0) return null;

  const startIdx = (page - 1) * limit + 1;
  const endIdx = Math.min(page * limit, total);

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-1 bg-transparent">
      <span className="text-xs font-semibold text-slate-500">
        Showing <span className="text-slate-800 font-bold">{startIdx}</span> to{' '}
        <span className="text-slate-800 font-bold">{endIdx}</span> of{' '}
        <span className="text-slate-800 font-bold">{total}</span> results
      </span>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-2 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-transparent transition-colors text-slate-600 disabled:cursor-not-allowed"
          aria-label="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              p === page
                ? 'bg-brand-accent text-brand-dark shadow-sm'
                : 'border border-slate-200 hover:bg-slate-100 text-slate-650'
            }`}
          >
            {p}
          </button>
        ))}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="p-2 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-transparent transition-colors text-slate-600 disabled:cursor-not-allowed"
          aria-label="Next Page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
