import React from 'react';

export const InvoiceStatusBadge = ({ status }) => {
  const baseClass = "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border";
  
  switch (status) {
    case 'draft':
      return (
        <span className={`${baseClass} bg-yellow-500/10 border-yellow-500/25 text-yellow-650`}>
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
          Draft
        </span>
      );
    case 'sent':
      return (
        <span className={`${baseClass} bg-blue-500/10 border-blue-500/25 text-blue-600`}>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          Sent
        </span>
      );
    case 'partially_paid':
      return (
        <span className={`${baseClass} bg-orange-500/10 border-orange-500/25 text-orange-600`}>
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
          Partially Paid
        </span>
      );
    case 'paid':
      return (
        <span className={`${baseClass} bg-emerald-500/10 border-emerald-500/25 text-emerald-500`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Paid
        </span>
      );
    case 'overdue':
      return (
        <span className={`${baseClass} bg-rose-500/10 border-rose-500/25 text-rose-600`}>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
          Overdue
        </span>
      );
    case 'cancelled':
      return (
        <span className={`${baseClass} bg-slate-500/10 border-slate-500/25 text-slate-450`}>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          Cancelled
        </span>
      );
    default:
      return (
        <span className={`${baseClass} bg-slate-100 border-slate-200 text-slate-500`}>
          {status}
        </span>
      );
  }
};

export default InvoiceStatusBadge;
