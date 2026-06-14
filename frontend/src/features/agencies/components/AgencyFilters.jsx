import React from 'react';
import SearchBar from '../../../components/common/SearchBar';
import FilterBar from '../../../components/common/FilterBar';
import { SlidersHorizontal } from 'lucide-react';

export const AgencyFilters = ({
  onSearch,
  status,
  onStatusChange
}) => {
  return (
    <FilterBar>
      <div className="w-full md:w-72">
        <SearchBar onSearch={onSearch} placeholder="Search agencies..." />
      </div>

      <div className="flex items-center gap-2 ml-auto w-full md:w-auto">
        <SlidersHorizontal className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status:</span>
        <select
          value={status}
          onChange={onStatusChange}
          className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-colors"
        >
          <option value="all">All Agencies</option>
          <option value="true">Active Only</option>
          <option value="false">Inactive Only</option>
        </select>
      </div>
    </FilterBar>
  );
};

export default AgencyFilters;
