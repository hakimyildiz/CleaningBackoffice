import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Download } from 'lucide-react';
import { formatDate, formatGBP } from '../../../utils/formatters';

export const AgencyInvoiceTable = ({ invoices, isHistory = false }) => {
  const getStatusBadge = (status) => {
    let classes = '';
    switch (status?.toLowerCase()) {
      case 'paid':
        classes = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        break;
      case 'overdue':
        classes = 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse';
        break;
      case 'partially_paid':
        classes = 'bg-amber-50 text-amber-700 border-amber-200';
        break;
      case 'sent':
        classes = 'bg-blue-50 text-blue-700 border-blue-200';
        break;
      default:
        classes = 'bg-slate-50 text-slate-700 border-slate-200';
        break;
    }
    return (
      <span className={`px-2.5 py-0.5 border rounded-full text-[10px] font-bold uppercase tracking-wider ${classes}`}>
        {status?.replace('_', ' ')}
      </span>
    );
  };

  const handlePdfDownload = (e, invoiceId) => {
    e.preventDefault();
    e.stopPropagation();
    const apiBaseUrl = import.meta.env.VITE_API_URL || '/api/v1';
    window.open(`${apiBaseUrl}/agency-portal/invoices/${invoiceId}/pdf`, '_blank');
  };

  if (!invoices || invoices.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 font-semibold text-xs italic">
        No {isHistory ? 'completed' : 'outstanding'} invoices found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white border border-slate-200/80 rounded-3xl shadow-xs">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider select-none">
            <th className="px-6 py-4">Invoice No</th>
            <th className="px-6 py-4">Property</th>
            <th className="px-6 py-4">Clean Date</th>
            <th className="px-6 py-4">Due Date</th>
            <th className="px-6 py-4 text-right">Total</th>
            {!isHistory && <th className="px-6 py-4 text-right">Remaining</th>}
            <th className="px-6 py-4 text-center">Status</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-semibold text-slate-600">
          {invoices.map((inv) => (
            <tr key={inv.InvoiceID} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-6 py-4.5">
                <Link to={`/agency-portal/invoices/${inv.InvoiceID}`} className="text-brand-accent hover:underline font-bold">
                  {inv.InvoiceNumber}
                </Link>
              </td>
              <td className="px-6 py-4.5">
                <div className="font-bold text-slate-800">{inv.AddressLine}</div>
                <div className="text-[10px] text-slate-400 font-semibold mt-0.5">{inv.City}</div>
              </td>
              <td className="px-6 py-4.5 whitespace-nowrap">{formatDate(inv.ScheduledDate)}</td>
              <td className="px-6 py-4.5 whitespace-nowrap">{formatDate(inv.DueDate)}</td>
              <td className="px-6 py-4.5 text-right font-bold text-slate-800">{formatGBP(inv.Total)}</td>
              {!isHistory && (
                <td className="px-6 py-4.5 text-right font-black text-slate-800">
                  {formatGBP(inv.RemainingAmount)}
                </td>
              )}
              <td className="px-6 py-4.5 text-center whitespace-nowrap">{getStatusBadge(inv.Status)}</td>
              <td className="px-6 py-4.5 text-right whitespace-nowrap">
                <div className="flex justify-end gap-2">
                  <Link 
                    to={`/agency-portal/invoices/${inv.InvoiceID}`}
                    className="inline-flex items-center gap-1 bg-white hover:bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-slate-700 transition-all shadow-2xs"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View</span>
                  </Link>
                  <button
                    onClick={(e) => handlePdfDownload(e, inv.InvoiceID)}
                    className="inline-flex items-center gap-1 bg-white hover:bg-brand-accent/5 border border-brand-accent/20 text-brand-accent hover:border-brand-accent/40 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AgencyInvoiceTable;
