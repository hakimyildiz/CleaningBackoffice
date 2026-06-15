import React, { useState, useEffect } from 'react';
import useAuth from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/useToast';
import agencyPortalService from '../services/agencyPortalService';
import AgencyInvoiceTable from '../components/AgencyInvoiceTable';
import AgencyCreditWidget from '../components/AgencyCreditWidget';
import { Receipt, History, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

export const AgencyInvoicesPage = () => {
  const { role } = useAuth();
  const { addToast } = useToast();

  const [invoices, setInvoices] = useState([]);
  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(15);

  const [showHistory, setShowHistory] = useState(false);

  const fetchData = async (page = 1) => {
    try {
      const invoicesResult = await agencyPortalService.getInvoices({ page, limit });
      setInvoices(invoicesResult.data || []);
      setTotalPages(invoicesResult.pagination?.totalPages || 1);

      const billingResult = await agencyPortalService.getCreditBalance();
      setBilling(billingResult.data);
    } catch (err) {
      addToast('Failed to load invoices or balance data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage, addToast]);

  if (role === 'agency_staff') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-3xl p-6 text-center text-red-650 max-w-lg mx-auto mt-12 shadow-xs">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
        <h2 className="text-sm font-black">Access Denied</h2>
        <p className="text-xs font-semibold mt-1">Agency staff members are not authorized to view invoice details or balances.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-accent border-r-2" />
      </div>
    );
  }

  // Split invoices: outstanding (sent, partially_paid, overdue) vs completed history (paid, forwarded, cancelled)
  const outstandingInvoices = invoices.filter(
    (inv) => ['sent', 'partially_paid', 'overdue'].includes(inv.Status?.toLowerCase())
  );
  
  const historyInvoices = invoices.filter(
    (inv) => ['paid', 'forwarded', 'cancelled'].includes(inv.Status?.toLowerCase())
  );

  const hasOverdue = outstandingInvoices.some((inv) => inv.Status?.toLowerCase() === 'overdue');

  return (
    <div className="space-y-6 text-left max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-4">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <Receipt className="w-6 h-6 text-brand-accent" />
          <span>Billing & Invoices</span>
        </h1>
        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5">
          View outstanding bills, credits, and invoice history
        </p>
      </div>

      {/* Credit Balance Widgets */}
      {billing && <AgencyCreditWidget billingData={billing} />}

      {/* Outstanding Invoices Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
            Outstanding Invoices
          </h2>
          {hasOverdue && (
            <span className="text-[10px] font-bold text-red-650 bg-red-50 border border-red-200 px-2 py-0.5 rounded-lg uppercase animate-pulse">
              Overdue Owed
            </span>
          )}
        </div>
        
        <AgencyInvoiceTable invoices={outstandingInvoices} isHistory={false} />
      </div>

      {/* History Invoices Section */}
      <div className="space-y-4 pt-4">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-150 px-4 py-2.5 rounded-2xl border border-slate-200 transition-colors shadow-2xs"
        >
          <History className="w-4 h-4 shrink-0" />
          <span>{showHistory ? 'Hide Invoice History' : 'Show Invoice History'}</span>
          {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showHistory && (
          <div className="opacity-95 transition-opacity duration-200">
            <AgencyInvoiceTable invoices={historyInvoices} isHistory={true} />
          </div>
        )}
      </div>

      {/* Pagination (shown if > 1 page) */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-4 select-none">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-650 disabled:opacity-50 hover:bg-slate-50 disabled:hover:bg-white"
          >
            Prev
          </button>
          <span className="text-xs font-bold text-slate-500">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-650 disabled:opacity-50 hover:bg-slate-50 disabled:hover:bg-white"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AgencyInvoicesPage;
