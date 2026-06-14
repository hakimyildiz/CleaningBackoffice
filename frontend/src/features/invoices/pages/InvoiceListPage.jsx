import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import invoiceService from '../services/invoiceService';
import InvoiceTable from '../components/InvoiceTable';
import SearchBar from '../../../components/common/SearchBar';
import Pagination from '../../../components/common/Pagination';
import Modal from '../../../components/common/Modal';
import { useToast } from '../../../hooks/useToast';
import { SlidersHorizontal, FileSpreadsheet } from 'lucide-react';

export const InvoiceListPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filters State
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Modals state
  const [activeModal, setActiveModal] = useState(null); // 'approve' | 'cancel' | null
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const result = await invoiceService.getInvoices({
        page,
        limit,
        search,
        status: statusFilter || undefined,
        owner: ownerFilter || undefined,
        from: fromDate || undefined,
        to: toDate || undefined
      });
      setInvoices(result.data || []);
      setTotal(result.pagination?.total || 0);
      setTotalPages(result.pagination?.totalPages || 0);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to load invoices list.', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter, ownerFilter, fromDate, toDate, addToast]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleSearch = (query) => {
    setSearch(query);
    setPage(1);
  };

  const handleView = (invoice) => {
    navigate(`/invoices/${invoice.InvoiceID}`);
  };

  const openApproveModal = (invoice) => {
    setSelectedInvoice(invoice);
    setActiveModal('approve');
  };

  const handleQuickApprove = async () => {
    if (!selectedInvoice) return;
    setModalLoading(true);
    try {
      await invoiceService.approveInvoice(selectedInvoice.InvoiceID);
      addToast(`Invoice "${selectedInvoice.InvoiceNumber}" approved and sent successfully.`, 'success');
      setActiveModal(null);
      fetchInvoices();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to approve invoice.', 'error');
    } finally {
      setModalLoading(false);
      setSelectedInvoice(null);
    }
  };

  const openCancelModal = (invoice) => {
    setSelectedInvoice(invoice);
    setActiveModal('cancel');
  };

  const handleQuickCancel = async () => {
    if (!selectedInvoice) return;
    setModalLoading(true);
    try {
      await invoiceService.cancelInvoice(selectedInvoice.InvoiceID);
      addToast(`Invoice "${selectedInvoice.InvoiceNumber}" has been cancelled.`, 'success');
      setActiveModal(null);
      fetchInvoices();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to cancel invoice.', 'error');
    } finally {
      setModalLoading(false);
      setSelectedInvoice(null);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <FileSpreadsheet className="w-7 h-7 text-brand-primary" />
          Invoices & Billing
        </h1>
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mt-1">
          Review cleaner work summaries, manage draft overrides, and approve client invoices
        </p>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="w-full md:w-72">
            <SearchBar onSearch={handleSearch} placeholder="Search invoice no. or client..." />
          </div>

          <div className="flex flex-wrap items-center gap-4 ml-auto w-full md:w-auto text-xs font-semibold text-slate-500">
            <div className="flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4 text-slate-400" />
              <span className="uppercase tracking-wider">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none transition-colors"
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="uppercase tracking-wider">Owner:</span>
              <select
                value={ownerFilter}
                onChange={(e) => { setOwnerFilter(e.target.value); setPage(1); }}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none transition-colors"
              >
                <option value="">All Owners</option>
                <option value="customer">Customers Only</option>
                <option value="agency">Agencies Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Date Filters row */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 text-xs font-bold text-slate-450 uppercase">
          <span>Sent Date Range:</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
            className="bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded px-2.5 py-1 focus:outline-none"
          />
          <span>to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => { setToDate(e.target.value); setPage(1); }}
            className="bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded px-2.5 py-1 focus:outline-none"
          />
        </div>
      </div>

      {/* Main Table */}
      <InvoiceTable
        invoices={invoices}
        isLoading={loading}
        onView={handleView}
        onApprove={openApproveModal}
        onCancel={openCancelModal}
      />

      {/* Pagination */}
      {!loading && total > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          limit={limit}
          total={total}
          onPageChange={(p) => setPage(p)}
        />
      )}

      {/* Quick Approve Confirmation Modal */}
      <Modal
        isOpen={activeModal === 'approve'}
        onClose={() => { setActiveModal(null); setSelectedInvoice(null); }}
        title="Approve & Send Invoice"
        onConfirm={handleQuickApprove}
        confirmText="Approve"
        confirmVariant="primary"
        isLoading={modalLoading}
      >
        <p className="text-slate-650">
          Are you sure you want to approve invoice <strong>{selectedInvoice?.InvoiceNumber}</strong>?
        </p>
        <p className="mt-2 text-xs text-slate-450">
          This will finalize draft values, set the status to "Sent", and mark the linked service occurrence as billed.
        </p>
      </Modal>

      {/* Quick Cancel Confirmation Modal */}
      <Modal
        isOpen={activeModal === 'cancel'}
        onClose={() => { setActiveModal(null); setSelectedInvoice(null); }}
        title="Cancel Draft Invoice"
        onConfirm={handleQuickCancel}
        confirmText="Cancel Invoice"
        confirmVariant="danger"
        isLoading={modalLoading}
      >
        <p className="text-slate-650">
          Are you sure you want to cancel invoice <strong>{selectedInvoice?.InvoiceNumber}</strong>?
        </p>
        <p className="mt-2 text-xs text-slate-450">
          This will set the status of this draft billing ledger to "Cancelled". This action is irreversible.
        </p>
      </Modal>
    </div>
  );
};

export default InvoiceListPage;
