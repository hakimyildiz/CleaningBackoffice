import React from 'react';
import Table from '../../../components/common/Table';
import Badge from '../../../components/common/Badge';
import { formatGBP } from '../../../utils/formatters';
import { Edit2, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import useAuth from '../../../hooks/useAuth';
import { ROLES } from '../../../utils/constants';

export const EmployeeTable = ({
  employees = [],
  sortBy,
  sortOrder,
  onSort,
  onEdit,
  onToggleStatus,
  onDelete,
  isLoading
}) => {
  const { role } = useAuth();
  const isReadOnly = role === ROLES.CLEANER_MANAGER;

  const columns = [
    {
      key: 'SureName', // Maps DB field
      label: 'Name',
      sortable: true,
      render: (row) => `${row.FirstName} ${row.SureName}`
    },
    {
      key: 'Role',
      label: 'Role',
      sortable: true,
      render: (row) => <Badge variant={row.Role}>{row.Role}</Badge>
    },
    {
      key: 'Email',
      label: 'Email',
      sortable: true
    },
    {
      key: 'MobilePhone',
      label: 'Mobile',
      sortable: false,
      render: (row) => row.MobilePhone || '-'
    },
    {
      key: 'Rate',
      label: 'Rate',
      sortable: true,
      render: (row) => formatGBP(row.Rate)
    },
    {
      key: 'IsActive',
      label: 'Status',
      sortable: true,
      render: (row) => <Badge variant={row.IsActive ? 'active' : 'inactive'} />
    }
  ];

  // Render actions if not read-only for cleaner managers
  if (!isReadOnly) {
    columns.push({
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-2.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onEdit(row)}
            className="text-slate-400 hover:text-brand-accent transition-colors p-1"
            title="Edit Employee"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onToggleStatus(row)}
            className={`${row.IsActive ? 'text-emerald-500 hover:text-slate-400' : 'text-slate-400 hover:text-emerald-500'} transition-colors p-0.5`}
            title={row.IsActive ? 'Deactivate Employee' : 'Activate Employee'}
          >
            {row.IsActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
          </button>
          {role === ROLES.ADMIN && (
            <button
              onClick={() => onDelete(row)}
              className="text-slate-400 hover:text-red-500 transition-colors p-1"
              title="Delete Employee"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )
    });
  }

  return (
    <Table
      columns={columns}
      data={employees}
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSort={onSort}
      onRowClick={isReadOnly ? null : onEdit}
      isLoading={isLoading}
      emptyMessage="No employees found."
    />
  );
};

export default EmployeeTable;
