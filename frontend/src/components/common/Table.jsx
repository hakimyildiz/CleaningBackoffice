import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export const Table = ({
  columns,
  data = [],
  sortBy,
  sortOrder,
  onSort,
  onRowClick,
  isLoading = false,
  emptyMessage = 'No records found.'
}) => {
  const handleHeaderClick = (column) => {
    if (column.sortable && onSort) {
      onSort(column.key);
    }
  };

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[800px] border-collapse text-left text-sm text-slate-650">
        <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider sticky top-0 z-10">
          <tr>
            {columns.map((col) => {
              const isSorted = sortBy === col.key;
              return (
                <th
                  key={col.key}
                  onClick={() => handleHeaderClick(col)}
                  className={`px-6 py-3.5 select-none ${col.sortable ? 'cursor-pointer hover:bg-slate-100 hover:text-slate-800' : ''}`}
                >
                  <div className="flex items-center gap-1">
                    <span>{col.label}</span>
                    {col.sortable && (
                      <div className="w-4 h-4 flex items-center justify-center">
                        {isSorted ? (
                          sortOrder?.toLowerCase() === 'asc' 
                            ? <ChevronUp className="w-3.5 h-3.5 text-brand-accent" /> 
                            : <ChevronDown className="w-3.5 h-3.5 text-brand-accent" />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-300 opacity-0 hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, rIdx) => (
              <tr key={rIdx} className="animate-pulse">
                {columns.map((col) => (
                  <td key={col.key} className="px-6 py-4">
                    <div className="h-4 bg-slate-100 rounded w-5/6" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-16 text-center text-slate-400 font-semibold bg-slate-50/30">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rIdx) => (
              <tr
                key={row.id || row.UserID || row.EmployeeID || row.CustomerID || row.AgencyStaffID || rIdx}
                onClick={() => onRowClick && onRowClick(row)}
                className={`transition-colors duration-150 ${onRowClick ? 'cursor-pointer hover:bg-slate-50/60' : ''} ${rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/10'}`}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-6 py-3.5 font-medium text-slate-700">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
