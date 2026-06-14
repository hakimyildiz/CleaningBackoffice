import React from 'react';
import FilterBar from '../../../components/common/FilterBar';
import SearchBar from '../../../components/common/SearchBar';
import Select from '../../../components/common/Select';
import { ROLES } from '../../../utils/constants';

export const EmployeeFilters = ({
  search,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  statusFilter,
  onStatusFilterChange
}) => {
  const roleOptions = [
    { value: '', label: 'All Roles' },
    { value: ROLES.ADMIN, label: 'Admin' },
    { value: ROLES.MANAGER, label: 'Manager' },
    { value: ROLES.CLEANER_MANAGER, label: 'Cleaner Manager' },
    { value: ROLES.CLEANER, label: 'Cleaner' }
  ];

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

      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
        <Select
          options={roleOptions}
          value={roleFilter}
          onChange={(e) => onRoleFilterChange(e.target.value)}
          placeholder=""
          className="w-full sm:w-40"
        />

        <Select
          options={statusOptions}
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          placeholder=""
          className="w-full sm:w-40"
        />
      </div>
    </FilterBar>
  );
};

export default EmployeeFilters;
