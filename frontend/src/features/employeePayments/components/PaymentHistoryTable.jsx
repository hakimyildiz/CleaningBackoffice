import React from 'react';
import { formatDate, formatGBP } from '../../../utils/formatters';
import { Trash2 } from 'lucide-react';
import useAuth from '../../../hooks/useAuth';
import { ROLES } from '../../../utils/constants';

const PaymentHistoryTable = ({ payments, onDeleteClick }) => {
  const { role } = useAuth();
  const isAdmin = role === ROLES.ADMIN;

  const getTypeLabel = (type) => {
    switch (type) {
      case 'regular':
        return 'Regular Pay';
      case 'bonus':
        return 'Bonus';
      case 'expense':
        return 'Expense';
      case 'travel':
        return 'Travel';
      default:
        return 'Other';
    }
  };

  const getTypeBadgeClass = (type) => {
    switch (type) {
      case 'regular':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'bonus':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'expense':
        return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'travel':
        return 'bg-teal-50 text-teal-700 border-teal-100';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left text-xs font-semibold text-slate-650 border-collapse">
        <thead className="bg-slate-50 border-b border-slate-200/60 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          <tr>
            <th className="px-6 py-3.5">Date</th>
            <th className="px-6 py-3.5">Employee</th>
            <th className="px-6 py-3.5">Amount</th>
            <th className="px-6 py-3.5">Payment Type</th>
            <th className="px-6 py-3.5">Pay Period</th>
            <th className="px-6 py-3.5">Reference</th>
            <th className="px-6 py-3.5">Note</th>
            <th className="px-6 py-3.5 font-bold">Recorded By</th>
            {isAdmin && <th className="px-6 py-3.5 text-right">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {payments.length === 0 ? (
            <tr>
              <td colSpan={isAdmin ? 9 : 8} className="px-6 py-10 text-center text-slate-400 italic">
                No payment logs registered yet.
              </td>
            </tr>
          ) : (
            payments.map((p) => {
              const employeeName = `${p.EmployeeFirstName || ''} ${p.EmployeeSureName || ''}`;
              
              const payPeriod = p.PeriodFrom && p.PeriodTo
                ? `${formatDate(p.PeriodFrom)} - ${formatDate(p.PeriodTo)}`
                : '—';

              return (
                <tr key={p.EmployeePaymentID} className="hover:bg-slate-50/40 transition-colors">
                  <td className="px-6 py-4 text-slate-500 font-medium">
                    {formatDate(p.PaidAt)}
                  </td>
                  <td className="px-6 py-4 text-slate-800 font-bold">
                    {employeeName}
                  </td>
                  <td className="px-6 py-4 text-slate-900 font-black text-sm">
                    {formatGBP(p.Amount)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 border rounded-full text-[10px] font-bold uppercase tracking-wider ${getTypeBadgeClass(p.Type)}`}>
                      {getTypeLabel(p.Type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-medium">
                    {payPeriod}
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-medium">
                    {p.Reference || '—'}
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-medium max-w-[150px] truncate" title={p.Note}>
                    {p.Note || '—'}
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-medium">
                    {p.RecordedByFirstName ? `${p.RecordedByFirstName} ${p.RecordedBySureName}` : 'System'}
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => onDeleteClick(p)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete Payment Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PaymentHistoryTable;
