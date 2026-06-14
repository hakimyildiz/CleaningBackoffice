import React from 'react';
import FilterBar from '../../../components/common/FilterBar';
import SearchBar from '../../../components/common/SearchBar';
import Select from '../../../components/common/Select';
import { ROLES } from '../../../utils/constants';

export const AgencyStaffFilters = ({
  search,
  onSearchChange,
  agencies = [],
  agencyFilter,
  onAgencyFilterChange,
  roleFilter,
  onRoleFilterChange,
  statusFilter,
  onStatusFilterChange
}) => {
  const agencyOptions = [
    { value: '', label: 'All Agencies' },
    ...agencies.map((a) => ({ value: a.AgencyID.toString(), label: a.Name }))
  ];

  const roleOptions = [
    { value: '', label: 'All Roles' },
    { value: ROLES.AGENCY_MANAGER, label: 'Agency Manager' },
    { value: ROLES.AGENCY_BOOKKEEPER, label: 'Agency Bookkeeper' },
    { value: ROLES.AGENCY_STAFF, label: 'Agency Staff' }
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
          options={agencyOptions}
          value={agencyFilter}
          onChange={(e) => onAgencyFilterChange(e.target.value)}
          placeholder=""
          className="w-full sm:w-40"
        />

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

export default AgencyStaffFilters;
