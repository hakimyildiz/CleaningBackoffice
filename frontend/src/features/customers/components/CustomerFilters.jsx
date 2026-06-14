import React from 'react';
import FilterBar from '../../../components/common/FilterBar';
import SearchBar from '../../../components/common/SearchBar';
import Select from '../../../components/common/Select';

export const CustomerFilters = ({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange
}) => {
  const statusOptions = [
    { value: 'true', label: 'Active Status' },
    { value: 'false', label: 'Inactive Status' },
    { value: 'all', label: 'All Statuses' }
  ];

  return (
    <FilterBar>
      <SearchBar
        value={search}
        onChange={onSearchChange}
        placeholder="Search name, email, phone..."
      />

      <Select
        options={statusOptions}
        value={statusFilter}
        onChange={(e) => onStatusFilterChange(e.target.value)}
        placeholder=""
        className="w-full sm:w-40"
      />
    </FilterBar>
  );
};

export default CustomerFilters;
