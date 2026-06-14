import React from 'react';
import Table from '../../../components/common/Table';
import Badge from '../../../components/common/Badge';
import { Edit2, ToggleLeft, ToggleRight } from 'lucide-react';

export const AgencyTable = ({
  agencies = [],
  isLoading = false,
  onEdit,
  onToggleStatus,
  sortBy,
  sortOrder,
  onSort
}) => {
  const columns = [
    {
      key: 'Name',
      label: 'Agency Name',
      sortable: true,
      render: (row) => (
        <span 
          onClick={() => onEdit(row)}
          className="text-slate-800 font-bold hover:text-brand-accent cursor-pointer transition-colors"
        >
          {row.Name}
        </span>
      )
    },
    {
      key: 'CompanyNo',
      label: 'Company No',
      sortable: true,
      render: (row) => row.CompanyNo || '—'
    },
    {
      key: 'Email',
      label: 'Email',
      sortable: true,
      render: (row) => row.Email || '—'
    },
    {
      key: 'Phone',
      label: 'Phone',
      sortable: true,
      render: (row) => row.Phone || '—'
    },
    {
      key: 'PrimaryContact',
      label: 'Primary Contact',
      sortable: false,
      render: (row) => {
        if (row.ContactFirstName && row.ContactSureName) {
          return (
            <span className="font-semibold text-slate-700">
              {row.ContactFirstName} {row.ContactSureName}
            </span>
          );
        }
        return <span className="text-slate-400">—</span>;
      }
    },
    {
      key: 'IsActive',
      label: 'Status',
      sortable: true,
      render: (row) => (
        <Badge variant={row.IsActive === 1 || row.IsActive === true ? 'active' : 'inactive'} />
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (row) => {
        const isActive = row.IsActive === 1 || row.IsActive === true;
        return (
          <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onEdit(row)}
              className="p-1 hover:bg-slate-100 rounded-md text-slate-500 hover:text-slate-800 transition-colors"
              title="Edit Agency"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onToggleStatus(row)}
              className={`p-1 rounded-md transition-colors ${
                isActive 
                  ? 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-55' 
                  : 'text-slate-400 hover:text-slate-650 hover:bg-slate-100'
              }`}
              title={isActive ? 'Deactivate Agency' : 'Activate Agency'}
            >
              {isActive ? (
                <ToggleRight className="w-5 h-5" />
              ) : (
                <ToggleLeft className="w-5 h-5" />
              )}
            </button>
          </div>
        );
      }
    }
  ];

  return (
    <Table
      columns={columns}
      data={agencies}
      isLoading={isLoading}
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSort={onSort}
      emptyMessage="No agencies found."
    />
  );
};

export default AgencyTable;
