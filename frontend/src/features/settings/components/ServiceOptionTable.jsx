import React from 'react';
import Table from '../../../components/common/Table';
import Badge from '../../../components/common/Badge';
import { Edit2, ToggleLeft, ToggleRight } from 'lucide-react';
import { formatGBP } from '../../../utils/formatters';

export const ServiceOptionTable = ({
  options = [],
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
      label: 'Option Name',
      sortable: true
    },
    {
      key: 'IsChargeable',
      label: 'Type',
      sortable: true,
      render: (row) => (
        <span className={`text-xs font-semibold ${row.IsChargeable ? 'text-amber-600' : 'text-slate-500'}`}>
          {row.IsChargeable ? 'Chargeable' : 'Free Add-on'}
        </span>
      )
    },
    {
      key: 'Fee',
      label: 'Fee',
      sortable: true,
      render: (row) => {
        if (!row.IsChargeable || parseFloat(row.Fee) === 0) {
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 uppercase">
              Free
            </span>
          );
        }
        return <span className="font-bold text-slate-800">{formatGBP(row.Fee)}</span>;
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
              title="Edit Option"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onToggleStatus(row)}
              className={`p-1 rounded-md transition-colors ${
                isActive 
                  ? 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50' 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }`}
              title={isActive ? 'Deactivate Option' : 'Activate Option'}
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
      data={options}
      isLoading={isLoading}
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSort={onSort}
      emptyMessage="No service options found."
    />
  );
};

export default ServiceOptionTable;
