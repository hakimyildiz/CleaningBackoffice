import React, { useState, useEffect } from 'react';
import paymentService from '../services/paymentService';
import PaymentTable from '../components/PaymentTable';
import Button from '../../../components/common/Button';
import Modal from '../../../components/common/Modal';
import { useToast } from '../../../hooks/useToast';
import { Search, Calendar, Filter, RotateCcw } from 'lucide-react';

export const PaymentListPage = () => {
  const { addToast } = useToast();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [page, setPage] = useState(1);

  // Filters state
  const [search, setSearch] = useState('');
  const [method, setMethod] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  // Delete payment modal state
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const result = await paymentService.getPayments({
        page,
        limit: 15,
        search: search || undefined,
        method: method || undefined,
        from: from || undefined,
        to: to || undefined
      });
      setPayments(result.data);
      setPagination(result.pagination);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to fetch payments.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPayments();
  };

  const handleResetFilters = () => {
    setSearch('');
    setMethod('');
    setFrom('');
    setTo('');
    setPage(1);
    // Fetch directly with empty params
    setTimeout(() => {
      fetchPayments();
    }, 0);
  };

  const handleDeleteConfirm = async () => {
    if (!paymentToDelete) return;
    setDeleting(true);
    try {
      await paymentService.deletePayment(paymentToDelete.PaymentID);
      addToast('Payment record deleted successfully, invoice balance adjusted.', 'success');
      setPaymentToDelete(null);
      fetchPayments();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete payment.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 text-left max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Payments Ledger</h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5">
            Audit and reconcile customer payment transactions
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Text search */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Search</label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-brand-accent focus:bg-white"
                  placeholder="Invoice, Customer, Agency..."
                />
              </div>
            </div>

            {/* Method Filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Payment Method</label>
              <div className="relative">
                <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-brand-accent focus:bg-white appearance-none"
                >
                  <option value="">All Methods</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Date From */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Paid From</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-brand-accent focus:bg-white"
                />
              </div>
            </div>

            {/* Date To */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Paid To</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-brand-accent focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleResetFilters}
              className="flex items-center gap-1 text-xs py-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex items-center gap-1 text-xs py-1.5"
            >
              <span>Apply Filters</span>
            </Button>
          </div>
        </form>
      </div>

      {/* Payments List Card */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-accent border-r-2" />
          </div>
        ) : (
          <>
            <PaymentTable payments={payments} onDeleteClick={(p) => setPaymentToDelete(p)} />

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-100 text-xs font-bold text-slate-500">
                <span>
                  Showing page {pagination.page} of {pagination.totalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                    className="py-1 px-3 text-xs"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPage((prev) => Math.min(prev + 1, pagination.totalPages))}
                    disabled={page === pagination.totalPages}
                    className="py-1 px-3 text-xs"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!paymentToDelete}
        onClose={() => setPaymentToDelete(null)}
        title="Delete Payment Record"
        onConfirm={handleDeleteConfirm}
        confirmText="Delete Payment"
        confirmVariant="danger"
        isLoading={deleting}
      >
        <p className="text-slate-650 text-sm">
          Are you sure you want to delete this payment of <strong>£{parseFloat(paymentToDelete?.Amount || 0).toFixed(2)}</strong> recorded against invoice <strong>{paymentToDelete?.InvoiceNumber}</strong>?
        </p>
        <p className="mt-2 text-xs text-red-650 bg-red-50 border border-red-100 p-2.5 rounded-xl font-bold">
          Warning: This action will increase the invoice's remaining balance by £{parseFloat(paymentToDelete?.Amount || 0).toFixed(2)} and rollback any auto-generated credit.
        </p>
      </Modal>
    </div>
  );
};

export default PaymentListPage;
