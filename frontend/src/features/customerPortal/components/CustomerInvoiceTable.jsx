import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Download } from 'lucide-react';
import { formatDate, formatGBP } from '../../../utils/formatters';
import Button from '../../../components/common/Button';

const getStatusBadge = (status) => {
  let classes = '';
  switch (status) {
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
      {status.replace('_', ' ')}
    </span>
  );
};

export const CustomerInvoiceTable = ({ invoices, isHistory = false }) => {
  const handlePdfDownload = (e, invoiceId, invoiceNo) => {
    e.preventDefault();
    e.stopPropagation();
    // Use the native window redirect since the API streams the attachment directly
    const apiBaseUrl = import.meta.env.VITE_API_URL || '/api/v1';
    window.open(`${apiBaseUrl}/customer-portal/invoices/${invoiceId}/pdf`, '_blank');
  };

  if (!invoices || invoices.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 font-semibold text-xs italic">
        No {isHistory ? 'completed' : 'outstanding'} invoices found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider select-none">
            <th className="px-6 py-3.5">Invoice No</th>
            <th className="px-6 py-3.5">Clean Date</th>
            <th className="px-6 py-3.5">Due Date</th>
            <th className="px-6 py-3.5 right-align">Total</th>
            {!isHistory && <th className="px-6 py-3.5 right-align">Remaining</th>}
            <th className="px-6 py-3.5 text-center">Status</th>
            <th className="px-6 py-3.5 right-align">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-semibold text-slate-650">
          {invoices.map((inv) => (
            <tr key={inv.InvoiceID} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-6 py-4">
                <Link to={`/customer-portal/invoices/${inv.InvoiceID}`} className="text-brand-accent hover:underline font-bold">
                  {inv.InvoiceNumber}
                </Link>
              </td>
              <td className="px-6 py-4">{formatDate(inv.ScheduledDate)}</td>
              <td className="px-6 py-4">{formatDate(inv.DueDate)}</td>
              <td className="px-6 py-4 right-align font-bold text-slate-800">{formatGBP(inv.Total)}</td>
              {!isHistory && (
                <td className="px-6 py-4 right-align font-black text-slate-800">
                  {formatGBP(inv.RemainingAmount)}
                </td>
              )}
              <td className="px-6 py-4 text-center">{getStatusBadge(inv.Status)}</td>
              <td className="px-6 py-4 right-align">
                <div className="flex justify-end gap-2">
                  <Link to={`/customer-portal/invoices/${inv.InvoiceID}`}>
                    <Button variant="outline" className="py-1 px-2.5 flex items-center gap-1 text-[11px] font-bold">
                      <FileText className="w-3.5 h-3.5" />
                      <span>View</span>
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={(e) => handlePdfDownload(e, inv.InvoiceID, inv.InvoiceNumber)}
                    className="py-1 px-2.5 flex items-center gap-1 text-[11px] font-bold border-brand-accent/20 text-brand-accent hover:bg-brand-accent/5 hover:border-brand-accent/40"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CustomerInvoiceTable;
