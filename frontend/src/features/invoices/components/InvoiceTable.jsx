import React from 'react';
import { Eye, CheckCircle2, XCircle } from 'lucide-react';
import InvoiceStatusBadge from './InvoiceStatusBadge';
import { formatDate, formatGBP } from '../../../utils/formatters';

export const InvoiceTable = ({ 
  invoices = [], 
  isLoading = false,
  onView,
  onApprove,
  onCancel
}) => {
  if (isLoading) {
    return (
      <div className="w-full bg-white border border-slate-200 rounded-2xl p-8 text-center animate-pulse">
        <div className="space-y-4">
          <div className="h-6 bg-slate-100 rounded w-1/4 mx-auto" />
          <div className="h-10 bg-slate-50 rounded" />
          <div className="h-10 bg-slate-50 rounded" />
          <div className="h-10 bg-slate-50 rounded" />
        </div>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="w-full bg-white border border-slate-200 rounded-2xl p-16 text-center text-slate-400 font-semibold shadow-xs">
        No invoices found matching current criteria.
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
      <table className="w-full min-w-[1000px] border-collapse text-left text-sm text-slate-650">
        <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider sticky top-0 z-10">
          <tr>
            <th className="px-6 py-3.5">Invoice No</th>
            <th className="px-6 py-3.5">Customer / Agency</th>
            <th className="px-6 py-3.5">Service Date</th>
            <th className="px-6 py-3.5">Sub Total</th>
            <th className="px-6 py-3.5">Extras</th>
            <th className="px-6 py-3.5">Grand Total</th>
            <th className="px-6 py-3.5">Status</th>
            <th className="px-6 py-3.5">Due Date</th>
            <th className="px-6 py-3.5 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {invoices.map((inv) => {
            const ownerName = inv.CustomerID 
              ? `${inv.CustomerFirstName} ${inv.CustomerSureName}`
              : inv.AgencyName;
            
            const isDraft = inv.Status === 'draft';

            return (
              <tr key={inv.InvoiceID} className="hover:bg-slate-50/40 transition-colors duration-150">
                <td className="px-6 py-3.5 font-bold text-slate-800">{inv.InvoiceNumber}</td>
                <td className="px-6 py-3.5">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-700">{ownerName}</span>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                      {inv.CustomerID ? 'Customer' : 'Agency'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-3.5 font-semibold text-slate-600">{formatDate(inv.ServiceDate)}</td>
                <td className="px-6 py-3.5 font-semibold text-slate-700">{formatGBP(inv.SubTotal)}</td>
                <td className="px-6 py-3.5 font-semibold text-slate-500">{formatGBP(inv.ExtrasTotal)}</td>
                <td className="px-6 py-3.5 font-bold text-slate-800">{formatGBP(inv.Total)}</td>
                <td className="px-6 py-3.5">
                  <InvoiceStatusBadge status={inv.Status} />
                </td>
                <td className="px-6 py-3.5 text-slate-500 font-semibold">{formatDate(inv.DueDate)}</td>
                <td className="px-6 py-3.5 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => onView(inv)}
                      className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition-colors"
                      title="View Detail"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    {isDraft && (
                      <>
                        <button
                          onClick={() => onApprove(inv)}
                          className="p-1.5 hover:bg-emerald-50 rounded text-emerald-600 hover:text-emerald-800 transition-colors"
                          title="Quick Approve"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onCancel(inv)}
                          className="p-1.5 hover:bg-rose-50 rounded text-rose-500 hover:text-rose-700 transition-colors"
                          title="Quick Cancel"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default InvoiceTable;
