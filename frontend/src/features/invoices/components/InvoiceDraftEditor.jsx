import React, { useState, useEffect } from 'react';
import FormField from '../../../components/common/FormField';
import Button from '../../../components/common/Button';
import { formatGBP } from '../../../utils/formatters';
import { Save } from 'lucide-react';

export const InvoiceDraftEditor = ({ 
  invoice, 
  onSave, 
  isSaving = false 
}) => {
  const [rate, setRate] = useState('');
  const [hours, setHours] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (invoice) {
      // If overrides exist, load them; otherwise load original record rate and hours
      const record = invoice.serviceRecord || {};
      const initialRate = invoice.RateOverride !== null && invoice.RateOverride !== undefined
        ? String(invoice.RateOverride)
        : String(record.Rate || 20.00);

      const initialHours = invoice.HoursOverride !== null && invoice.HoursOverride !== undefined
        ? String(invoice.HoursOverride)
        : String(record.EstimatedHours || 2.0);

      setRate(initialRate);
      setHours(initialHours);
      setNote(invoice.Note || '');
      setErrors({});
    }
  }, [invoice]);

  const numRate = parseFloat(rate) || 0;
  const numHours = parseFloat(hours) || 0;
  const calculatedSubTotal = numRate * numHours;
  const extrasTotal = parseFloat(invoice.ExtrasTotal || 0);
  const calculatedGrandTotal = calculatedSubTotal + extrasTotal;

  const validate = () => {
    const tempErrors = {};
    if (rate === '' || isNaN(numRate) || numRate < 0) {
      tempErrors.rate = 'Rate must be a positive decimal number.';
    }
    if (hours === '' || isNaN(numHours) || numHours < 0 || numHours > 24) {
      tempErrors.hours = 'Hours must be between 0 and 24 hours.';
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      hoursOverride: hours,
      rateOverride: rate,
      note: note.trim()
    });
  };

  const isReadOnly = invoice.Status !== 'draft';

  return (
    <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs text-left space-y-5">
      <h3 className="text-sm font-bold text-brand-primary border-b border-slate-100 pb-2 flex items-center justify-between">
        <span>Invoice Charges Editor</span>
        {isReadOnly && (
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Read Only</span>
        )}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField label="Service Rate Override (£/hr)" required error={errors.rate}>
          <input
            type="number"
            step="0.01"
            min="0"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            disabled={isReadOnly || isSaving}
            className="w-full bg-white disabled:bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-all duration-150"
            placeholder="0.00"
          />
        </FormField>

        <FormField label="Estimated Hours Override" required error={errors.hours}>
          <input
            type="number"
            step="0.5"
            min="0"
            max="24"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            disabled={isReadOnly || isSaving}
            className="w-full bg-white disabled:bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-all duration-150"
            placeholder="0.0"
          />
        </FormField>

        <FormField label="Calculated Sub Total" error={null}>
          <input
            type="text"
            value={formatGBP(calculatedSubTotal)}
            disabled
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500"
          />
        </FormField>
      </div>

      {/* Snapshot options summary */}
      {invoice.serviceRecord?.options && invoice.serviceRecord.options.length > 0 && (
        <div className="space-y-2.5 bg-slate-50/50 p-4 border border-slate-250/60 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block border-b border-slate-200/60 pb-1.5 mb-2">
            Selected Add-on Options Snapshot
          </span>
          <div className="space-y-2">
            {invoice.serviceRecord.options.map((opt) => (
              <div key={opt.ServiceRecordOptionID} className="flex justify-between items-center text-xs text-slate-650 font-bold">
                <span className="text-slate-600">{opt.Name}</span>
                <span className={opt.IsChargeable === 1 ? 'text-teal-600' : 'text-emerald-500 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100'}>
                  {opt.IsChargeable === 1 ? formatGBP(opt.Fee) : 'Free'}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center border-t border-slate-200/60 pt-2 text-xs font-black text-slate-700">
            <span>Extras Total:</span>
            <span>{formatGBP(extrasTotal)}</span>
          </div>
        </div>
      )}

      {/* Grand Total Preview Card */}
      <div className="flex justify-between items-center bg-slate-50 border border-slate-200 p-4 rounded-2xl shadow-inner">
        <div>
          <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Grand Invoice Total:</span>
          <span className="text-lg font-black text-slate-800 mt-1 block">
            {formatGBP(calculatedGrandTotal)}
          </span>
        </div>
        <div className="text-right text-xs font-semibold text-slate-400">
          <div>Subtotal: {formatGBP(calculatedSubTotal)}</div>
          <div>Extras: {formatGBP(extrasTotal)}</div>
        </div>
      </div>

      {/* Notes field */}
      <FormField label="Invoice Notes" error={null}>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={isReadOnly || isSaving}
          placeholder="Add memo, adjustment reasoning, or client messages..."
          rows={3}
          className="w-full bg-white disabled:bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-all duration-150"
        />
      </FormField>

      {/* Save Button */}
      {!isReadOnly && (
        <div className="flex justify-end pt-3 border-t border-slate-100">
          <Button
            type="submit"
            disabled={isSaving}
            isLoading={isSaving}
            variant="primary"
            className="px-6 font-bold flex items-center gap-1.5 shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>Save Draft Changes</span>
          </Button>
        </div>
      )}
    </form>
  );
};

export default InvoiceDraftEditor;
