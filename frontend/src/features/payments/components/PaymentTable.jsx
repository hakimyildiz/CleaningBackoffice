import React from 'react';
import { formatDate, formatGBP } from '../../../utils/formatters';
import { Trash2, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import useAuth from '../../../hooks/useAuth';
import { ROLES } from '../../../utils/constants';

const PaymentTable = ({ payments, onDeleteClick }) => {
  const { role } = useAuth();
  const isAdmin = role === ROLES.ADMIN;

  const getMethodLabel = (method) => {
    switch (method) {
      case 'bank_transfer':
        return 'Bank Transfer';
      case 'cash':
        return 'Cash';
      case 'card':
        return 'Card';
      default:
        return 'Other';
    }
  };

  const getMethodBadgeClass = (method) => {
    switch (method) {
      case 'bank_transfer':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'cash':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'card':
        return 'bg-purple-50 text-purple-700 border-purple-100';
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
            <th className="px-6 py-3.5">Invoice No</th>
            <th className="px-6 py-3.5">Customer / Agency</th>
            <th className="px-6 py-3.5">Amount</th>
            <th className="px-6 py-3.5">Method</th>
            <th className="px-6 py-3.5">Reference</th>
            <th className="px-6 py-3.5">Recorded By</th>
            {isAdmin && <th className="px-6 py-3.5 text-right">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {payments.length === 0 ? (
            <tr>
              <td colSpan={isAdmin ? 8 : 7} className="px-6 py-10 text-center text-slate-400 italic">
                No payments found matching the criteria.
              </td>
            </tr>
          ) : (
            payments.map((p) => {
              const clientName = p.CustomerID
                ? `${p.CustomerFirstName || ''} ${p.CustomerSureName || ''}`
                : p.AgencyName || '—';

              return (
                <tr key={p.PaymentID} className="hover:bg-slate-50/40 transition-colors">
                  <td className="px-6 py-4 text-slate-500 font-medium">
                    {formatDate(p.PaidAt)}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      to={`/invoices/${p.InvoiceID}`}
                      className="inline-flex items-center gap-1 font-bold text-brand-accent hover:text-brand-primary"
                    >
                      <span>{p.InvoiceNumber}</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-slate-800 font-bold">
                    {clientName}
                  </td>
                  <td className="px-6 py-4 text-slate-900 font-black text-sm">
                    {formatGBP(p.Amount)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 border rounded-full text-[10px] font-bold uppercase tracking-wider ${getMethodBadgeClass(p.Method)}`}>
                      {getMethodLabel(p.Method)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-medium">
                    {p.Reference || '—'}
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

export default PaymentTable;
