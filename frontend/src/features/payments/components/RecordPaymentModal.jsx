import React, { useState, useEffect } from 'react';
import Modal from '../../../components/common/Modal';
import Button from '../../../components/common/Button';
import { formatGBP } from '../../../utils/formatters';

const RecordPaymentModal = ({ isOpen, onClose, invoice, onRecord, isLoading }) => {
  const invoiceTotal = parseFloat(invoice?.Total || 0);
  const creditApplied = parseFloat(invoice?.CreditApplied || 0);
  const prevBalance = parseFloat(invoice?.PreviousBalance || 0);
  
  // RemainingAmount in database holds the currently unpaid portion of Total
  const initialRemaining = parseFloat(invoice?.RemainingAmount ?? invoiceTotal);

  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bank_transfer');
  const [paidAt, setPaidAt] = useState('');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');

  // Set default values when modal opens
  useEffect(() => {
    if (isOpen && invoice) {
      setAmount(initialRemaining.toFixed(2));
      
      // Default to current date and time in local timezone for picker
      const now = new Date();
      const tzOffset = now.getTimezoneOffset() * 60000; // offset in milliseconds
      const localISOTime = (new Date(now - tzOffset)).toISOString().slice(0, 16);
      setPaidAt(localISOTime);
      
      setMethod('bank_transfer');
      setReference('');
      setNote('');
    }
  }, [isOpen, invoice, initialRemaining]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Please enter a valid positive payment amount.');
      return;
    }

    onRecord({
      amount: parsedAmount,
      method,
      paidAt: new Date(paidAt).toISOString(),
      reference,
      note
    });
  };

  const parsedAmount = parseFloat(amount) || 0;
  const remainingAfterPayment = initialRemaining - parsedAmount;
  const isOverpayment = remainingAfterPayment < 0;
  const overpaymentCredit = Math.abs(remainingAfterPayment);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Record Payment for ${invoice?.InvoiceNumber}`}
      confirmText="Record Payment"
      confirmVariant="primary"
      isLoading={isLoading}
      showFooter={false} // We use form submit handler
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Amount input */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Payment Amount (£)*
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">£</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max="99999.99"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-7 pr-3 text-sm font-bold text-slate-800 focus:outline-hidden focus:border-brand-accent focus:bg-white"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Paid At input */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Date & Time Paid*
            </label>
            <input
              type="datetime-local"
              required
              value={paidAt}
              onChange={(e) => setPaidAt(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm font-bold text-slate-800 focus:outline-hidden focus:border-brand-accent focus:bg-white"
            />
          </div>

          {/* Method dropdown */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Payment Method*
            </label>
            <select
              required
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm font-bold text-slate-800 focus:outline-hidden focus:border-brand-accent focus:bg-white"
            >
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Reference input */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Reference / Tx ID
            </label>
            <input
              type="text"
              maxLength={100}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm font-bold text-slate-800 focus:outline-hidden focus:border-brand-accent focus:bg-white"
              placeholder="e.g. BARC-102938"
            />
          </div>
        </div>

        {/* Note textarea */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Payment Notes
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm font-semibold text-slate-800 focus:outline-hidden focus:border-brand-accent focus:bg-white"
            placeholder="Add payment specific notes..."
          />
        </div>

        {/* Live feedback balance card */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 text-xs font-bold text-slate-600 space-y-1.5">
          <div className="flex justify-between">
            <span className="text-slate-400">Invoice Total:</span>
            <span>{formatGBP(invoiceTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Remaining Balance:</span>
            <span>{formatGBP(initialRemaining)}</span>
          </div>
          
          <div className="border-t border-slate-200/80 my-2 pt-2 flex justify-between text-sm">
            <span>Resulting Status:</span>
            <span>
              {isOverpayment ? (
                <span className="text-emerald-600 uppercase">Paid (with credit)</span>
              ) : remainingAfterPayment === 0 ? (
                <span className="text-emerald-600 uppercase">Paid</span>
              ) : (
                <span className="text-amber-600 uppercase">Partially Paid</span>
              )}
            </span>
          </div>

          {isOverpayment && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-2.5 rounded-xl text-center font-bold">
              An account credit of <strong className="text-emerald-950 font-black">{formatGBP(overpaymentCredit)}</strong> will be automatically generated for future invoices.
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Record Payment
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default RecordPaymentModal;
