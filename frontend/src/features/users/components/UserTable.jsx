import React from 'react';
import Table from '../../../components/common/Table';
import Badge from '../../../components/common/Badge';
import { formatDate } from '../../../utils/formatters';
import { ToggleLeft, ToggleRight, KeyRound } from 'lucide-react';

export const UserTable = ({
  users = [],
  onToggleStatus,
  onResetPassword,
  isLoading
}) => {
  const columns = [
    {
      key: 'Username',
      label: 'Username',
      sortable: false
    },
    {
      key: 'FullName',
      label: 'Full Name',
      sortable: false,
      render: (row) => `${row.FirstName} ${row.SureName}`
    },
    {
      key: 'Role',
      label: 'Role',
      sortable: false,
      render: (row) => <Badge variant={row.Role}>{row.Role}</Badge>
    },
    {
      key: 'LastLoginAt',
      label: 'Last Login',
      sortable: false,
      render: (row) => row.LastLoginAt ? formatDate(row.LastLoginAt) : 'Never'
    },
    {
      key: 'IsActive',
      label: 'Status',
      sortable: false,
      render: (row) => <Badge variant={row.IsActive ? 'active' : 'inactive'} />
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-2.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onToggleStatus(row)}
            className={`${row.IsActive ? 'text-emerald-500 hover:text-slate-400' : 'text-slate-400 hover:text-emerald-500'} transition-colors p-0.5`}
            title={row.IsActive ? 'Deactivate User' : 'Activate User'}
          >
            {row.IsActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
          </button>
          <button
            onClick={() => onResetPassword(row)}
            className="text-slate-400 hover:text-brand-accent transition-colors p-1"
            title="Reset Password"
          >
            <KeyRound className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    }
  ];

  return (
    <Table
      columns={columns}
      data={users}
      isLoading={isLoading}
      emptyMessage="No users found."
    />
  );
};

export default UserTable;
