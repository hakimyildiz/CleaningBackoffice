import React, { useState, useEffect } from 'react';
import customerPortalService from '../services/customerPortalService';
import CustomerInvoiceTable from '../components/CustomerInvoiceTable';
import Button from '../../../components/common/Button';
import { useToast } from '../../../hooks/useToast';
import { Sparkles, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { formatGBP } from '../../../utils/formatters';

export const CustomerInvoicesPage = () => {
  const { addToast } = useToast();
  
  const [outstandingInvoices, setOutstandingInvoices] = useState([]);
  const [historyInvoices, setHistoryInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showHistory, setShowHistory] = useState(false);

  // Pagination states (we can support basic pagination for all, or query outstanding directly)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [page, setPage] = useState(1);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      // Query customer invoices with page and high limit to sort them locally
      const result = await customerPortalService.getInvoices({ page, limit: 100 });
      const allInvoices = result.data || [];
      
      const outstanding = allInvoices.filter(inv => ['sent', 'partially_paid', 'overdue'].includes(inv.Status));
      const history = allInvoices.filter(inv => ['paid', 'forwarded', 'cancelled'].includes(inv.Status));
      
      setOutstandingInvoices(outstanding);
      setHistoryInvoices(history);
      setPagination(result.pagination);
    } catch (err) {
      addToast('Failed to load invoices list.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [page]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-accent border-r-2" />
      </div>
    );
  }

  // Calculate unpaid totals
  const unpaidTotal = outstandingInvoices.reduce((sum, inv) => sum + parseFloat(inv.RemainingAmount || 0), 0);
  const overdueInvoices = outstandingInvoices.filter(inv => inv.Status === 'overdue');
  const hasOverdue = overdueInvoices.length > 0;

  return (
    <div className="space-y-6 text-left max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="border-b border-slate-200/80 pb-4">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-amber-500" />
          <span>Invoices & Payments</span>
        </h1>
        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5">
          View outstanding bills, download PDF receipts and trace past payments
        </p>
      </div>

      {/* Overdue/Outstanding warning panel */}
      {outstandingInvoices.length > 0 && (
        <div className={`border-2 rounded-3xl p-5 shadow-xs flex items-start gap-3 text-xs ${
          hasOverdue 
            ? 'bg-rose-50 border-rose-200 text-rose-800' 
            : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${hasOverdue ? 'text-rose-600' : 'text-amber-600'}`} />
          <div>
            <h3 className="font-black text-sm">
              {hasOverdue ? 'Overdue Invoices Alert' : 'Outstanding Invoices'}
            </h3>
            <p className="mt-1 font-semibold text-slate-600 leading-relaxed">
              You have {outstandingInvoices.length} outstanding invoice(s) totalling{' '}
              <strong className="text-slate-800">{formatGBP(unpaidTotal)}</strong>. 
              {hasOverdue && ` (${overdueInvoices.length} invoice(s) are past their due date).`}
            </p>
          </div>
        </div>
      )}

      {/* Outstanding Section */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100">
          <h2 className="text-xs font-black text-slate-700 uppercase tracking-widest">
            Outstanding Invoices
          </h2>
        </div>
        <CustomerInvoiceTable invoices={outstandingInvoices} isHistory={false} />
      </div>

      {/* History Collapsed Section */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center justify-between px-6 py-4 bg-slate-50/50 hover:bg-slate-50 transition-colors focus:outline-hidden"
        >
          <span className="text-xs font-black text-slate-700 uppercase tracking-widest">
            Invoice History ({historyInvoices.length})
          </span>
          {showHistory ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </button>
        
        {showHistory && (
          <div className="border-t border-slate-100 bg-white">
            <CustomerInvoiceTable invoices={historyInvoices} isHistory={true} />
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerInvoicesPage;
