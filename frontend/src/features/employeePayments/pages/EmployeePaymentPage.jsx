import React, { useState, useEffect } from 'react';
import employeePaymentService from '../services/employeePaymentService';
import EarningsReportTable from '../components/EarningsReportTable';
import PaymentHistoryTable from '../components/PaymentHistoryTable';
import Button from '../../../components/common/Button';
import Modal from '../../../components/common/Modal';
import { useToast } from '../../../hooks/useToast';
import { Calendar, Users, Briefcase, Plus, Search, RotateCcw } from 'lucide-react';

export const EmployeePaymentPage = () => {
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('earnings'); // 'earnings' | 'history'
  const [employees, setEmployees] = useState([]);
  const [report, setReport] = useState([]);
  const [history, setHistory] = useState([]);
  
  // Loading states
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Filters state
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Payout Dialog Modal State
  const [payoutEmployee, setPayoutEmployee] = useState(null);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutType, setPayoutType] = useState('regular');
  const [payoutReference, setPayoutReference] = useState('');
  const [payoutNote, setPayoutNote] = useState('');
  const [payoutSubmitting, setPayoutSubmitting] = useState(false);

  // Deletion Modal State
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Setup default dates: first and last day of current month
  useEffect(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    
    // First day of month (yyyy-mm-dd)
    const firstDay = new Date(y, m, 1);
    const firstDayStr = firstDay.toISOString().split('T')[0];
    
    // Last day of month
    const lastDay = new Date(y, m + 1, 0);
    const lastDayStr = lastDay.toISOString().split('T')[0];

    setDateFrom(firstDayStr);
    setDateTo(lastDayStr);

    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setEmployeesLoading(true);
    try {
      const result = await employeePaymentService.getEmployees();
      setEmployees(result.data || []);
    } catch (err) {
      addToast('Failed to load employee list.', 'error');
    } finally {
      setEmployeesLoading(false);
    }
  };

  const generateReport = async () => {
    if (!dateFrom || !dateTo) {
      addToast('Please specify both start (from) and end (to) dates.', 'error');
      return;
    }
    setReportLoading(true);
    try {
      const result = await employeePaymentService.getEarnings({
        employeeId: selectedEmployeeId || undefined,
        from: dateFrom,
        to: dateTo
      });
      setReport(result.data || []);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to generate earnings report.', 'error');
    } finally {
      setReportLoading(false);
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const result = await employeePaymentService.getPayments({
        employeeId: selectedEmployeeId || undefined,
        from: dateFrom || undefined,
        to: dateTo || undefined
      });
      setHistory(result.data || []);
    } catch (err) {
      addToast('Failed to fetch payout logs.', 'error');
    } finally {
      setHistoryLoading(false);
    }
  };

  // Run automatically when dependencies align
  useEffect(() => {
    if (activeTab === 'earnings' && dateFrom && dateTo) {
      generateReport();
    } else if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const handleMarkAsPaid = (employee) => {
    setPayoutEmployee(employee);
    setPayoutAmount(employee.balance.toFixed(2));
    setPayoutType('regular');
    setPayoutReference('');
    setPayoutNote(`Regular pay for timesheet period ${dateFrom} to ${dateTo}`);
  };

  const handlePayoutSubmit = async (e) => {
    e.preventDefault();
    if (!payoutEmployee) return;

    setPayoutSubmitting(true);
    try {
      await employeePaymentService.recordPayment({
        employeeId: payoutEmployee.employeeId,
        amount: parseFloat(payoutAmount),
        type: payoutType,
        periodFrom: dateFrom,
        periodTo: dateTo,
        reference: payoutReference,
        note: payoutNote
      });

      addToast(`Payment of £${parseFloat(payoutAmount).toFixed(2)} recorded successfully for ${payoutEmployee.fullName}.`, 'success');
      setPayoutEmployee(null);
      // Refresh report
      generateReport();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to record payout.', 'error');
    } finally {
      setPayoutSubmitting(false);
    }
  };

  const handleDeleteHistoryConfirm = async () => {
    if (!paymentToDelete) return;
    setDeleting(true);
    try {
      await employeePaymentService.deletePayment(paymentToDelete.EmployeePaymentID);
      addToast('Employee payout log deleted successfully.', 'success');
      setPaymentToDelete(null);
      fetchHistory();
    } catch (err) {
      addToast('Failed to delete payment log.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 text-left max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Employee Payments</h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5">
            Process payroll calculations and track payment logs
          </p>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('earnings')}
          className={`pb-3 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${
            activeTab === 'earnings'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Earnings Report
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${
            activeTab === 'history'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Payment History
        </button>
      </div>

      {/* Filter and Query panel */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          {/* Employee dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Employee</label>
            <div className="relative">
              <Users className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                disabled={employeesLoading}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-brand-accent focus:bg-white appearance-none"
              >
                <option value="">All Employees</option>
                {employees.map((e) => (
                  <option key={e.EmployeeID} value={e.EmployeeID}>
                    {e.FirstName} {e.SureName} ({e.Role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Period From */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Period From</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-brand-accent focus:bg-white"
              />
            </div>
          </div>

          {/* Period To */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Period To</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-brand-accent focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-3 mt-4">
          <Button
            type="button"
            variant="primary"
            onClick={activeTab === 'earnings' ? generateReport : fetchHistory}
            className="flex items-center gap-1.5 text-xs py-1.5"
            isLoading={reportLoading || historyLoading}
          >
            <span>{activeTab === 'earnings' ? 'Generate Report' : 'Refresh Logs'}</span>
          </Button>
        </div>
      </div>

      {/* Main Results Table */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
        {activeTab === 'earnings' ? (
          reportLoading ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-accent border-r-2" />
            </div>
          ) : (
            <EarningsReportTable report={report} onMarkAsPaidClick={handleMarkAsPaid} />
          )
        ) : (
          historyLoading ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-accent border-r-2" />
            </div>
          ) : (
            <PaymentHistoryTable payments={history} onDeleteClick={(p) => setPaymentToDelete(p)} />
          )
        )}
      </div>

      {/* Mark as Paid Modal Form */}
      <Modal
        isOpen={!!payoutEmployee}
        onClose={() => setPayoutEmployee(null)}
        title={`Record Payment for ${payoutEmployee?.fullName}`}
        showFooter={false}
      >
        <form onSubmit={handlePayoutSubmit} className="space-y-4 text-left">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Payout Amount (£)*
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">£</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-7 pr-3 text-sm font-bold text-slate-800 focus:outline-hidden focus:border-brand-accent focus:bg-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Payment Type*
              </label>
              <select
                required
                value={payoutType}
                onChange={(e) => setPayoutType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm font-bold text-slate-800 focus:outline-hidden focus:border-brand-accent focus:bg-white"
              >
                <option value="regular">Regular Pay</option>
                <option value="bonus">Bonus</option>
                <option value="expense">Expense</option>
                <option value="travel">Travel</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Bank Reference / Note
              </label>
              <input
                type="text"
                maxLength={100}
                value={payoutReference}
                onChange={(e) => setPayoutReference(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm font-bold text-slate-800 focus:outline-hidden focus:border-brand-accent focus:bg-white"
                placeholder="e.g. BACS-BELLACLEAN"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Notes
            </label>
            <textarea
              value={payoutNote}
              onChange={(e) => setPayoutNote(e.target.value)}
              rows={2}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm font-semibold text-slate-800 focus:outline-hidden focus:border-brand-accent focus:bg-white"
              placeholder="Period summary or payroll details..."
            />
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setPayoutEmployee(null)} disabled={payoutSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={payoutSubmitting}>
              Confirm Payout
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Payout History Confirmation */}
      <Modal
        isOpen={!!paymentToDelete}
        onClose={() => setPaymentToDelete(null)}
        title="Delete Payout Log"
        onConfirm={handleDeleteHistoryConfirm}
        confirmText="Delete Log"
        confirmVariant="danger"
        isLoading={deleting}
      >
        <p className="text-slate-650 text-sm">
          Are you sure you want to delete the payout log of <strong>£{parseFloat(paymentToDelete?.Amount || 0).toFixed(2)}</strong> for <strong>{paymentToDelete?.EmployeeFirstName} {paymentToDelete?.EmployeeSureName}</strong>?
        </p>
        <p className="mt-2 text-xs text-slate-450 italic">
          This is an administrative action to delete the audit log. It will recalculate their paid stats.
        </p>
      </Modal>
    </div>
  );
};

export default EmployeePaymentPage;
