import React from 'react';
import SearchBar from '../../../components/common/SearchBar';
import FilterBar from '../../../components/common/FilterBar';
import { SlidersHorizontal, AlertTriangle } from 'lucide-react';

export const ServiceFilters = ({
  onSearch,
  filters = {},
  onFilterChange
}) => {
  const handleSelectChange = (field, e) => {
    onFilterChange(field, e.target.value);
  };

  const handleCheckboxChange = (field, e) => {
    onFilterChange(field, e.target.checked);
  };

  return (
    <div className="space-y-4">
      <FilterBar>
        {/* Search */}
        <div className="w-full md:w-72">
          <SearchBar onSearch={onSearch} placeholder="Search RefNo, Address, Postcode..." />
        </div>

        {/* Dynamic Select Filters */}
        <div className="flex flex-wrap items-center gap-4 ml-auto w-full md:w-auto">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Type:</span>
            <select
              value={filters.type || ''}
              onChange={(e) => handleSelectChange('type', e)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-colors"
            >
              <option value="">All Types</option>
              <option value="one_off">One-Off</option>
              <option value="regular">Regular</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status:</span>
            <select
              value={filters.status || ''}
              onChange={(e) => handleSelectChange('status', e)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-colors"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="pause_requested">Pause Requested</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">IsActive:</span>
            <select
              value={filters.isActive !== undefined ? filters.isActive.toString() : 'all'}
              onChange={(e) => {
                const val = e.target.value === 'all' ? '' : e.target.value;
                onFilterChange('isActive', val);
              }}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-colors"
            >
              <option value="all">All (Active/Inactive)</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>
          </div>
        </div>
      </FilterBar>

      {/* Special Pause Requests Filter Panel */}
      <div className="flex items-center bg-orange-50/50 border border-orange-100 rounded-xl px-4 py-2.5">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="showPauseRequests"
            checked={!!filters.showPauseRequests}
            onChange={(e) => handleCheckboxChange('showPauseRequests', e)}
            className="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-500 cursor-pointer"
          />
          <label
            htmlFor="showPauseRequests"
            className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5 cursor-pointer select-none"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-orange-550" />
            Show only pending customer Pause Requests
          </label>
        </div>
      </div>
    </div>
  );
};

export default ServiceFilters;
