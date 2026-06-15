import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import customerPortalService from '../services/customerPortalService';
import Button from '../../../components/common/Button';
import { useToast } from '../../../hooks/useToast';
import { formatDate, formatTime, formatGBP } from '../../../utils/formatters';
import { 
  ChevronLeft, FileText, Download, MapPin, 
  Calendar, Clock, CheckCircle2, AlertCircle, Info, Landmark 
} from 'lucide-react';

const getStatusBadge = (status) => {
  let classes = '';
  switch (status) {
    case 'paid':
      classes = 'bg-emerald-50 text-emerald-700 border-emerald-250';
      break;
    case 'overdue':
      classes = 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse';
      break;
    case 'partially_paid':
      classes = 'bg-amber-50 text-amber-700 border-amber-250';
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

export const CustomerInvoiceDetailPage = () => {
  const { id } = useParams();
  const { addToast } = useToast();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoiceDetail = async () => {
      try {
        const result = await customerPortalService.getInvoiceDetail(id);
        setData(result.data);
      } catch (err) {
        addToast(err.response?.data?.message || 'Failed to load invoice details.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchInvoiceDetail();
  }, [id]);

  const handleDownloadPDF = () => {
    if (!data?.invoice) return;
    const apiBaseUrl = import.meta.env.VITE_API_URL || '/api/v1';
    window.open(`${apiBaseUrl}/customer-portal/invoices/${id}/pdf`, '_blank');
    addToast('Downloading invoice PDF...', 'success');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-accent border-r-2" />
      </div>
    );
  }

  if (!data || !data.invoice) {
    return (
      <div className="text-center py-12 text-slate-400 font-semibold text-xs italic">
        Invoice details could not be found.
      </div>
    );
  }

  const { invoice, payments, options } = data;
  const isUnpaid = ['sent', 'partially_paid', 'overdue'].includes(invoice.Status);

  // Line items details
  const activeHours = invoice.HoursOverride !== null ? parseFloat(invoice.HoursOverride) : parseFloat(invoice.EstimatedHours);
  const activeRate = invoice.RateOverride !== null ? parseFloat(invoice.RateOverride) : parseFloat(invoice.BaseRate || 20.00);

  return (
    <div className="space-y-6 text-left max-w-4xl mx-auto">
      {/* Breadcrumb & Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="space-y-1">
          <Link
            to="/customer-portal/invoices"
            className="inline-flex items-center text-xs font-bold text-slate-400 hover:text-slate-650 uppercase tracking-wider transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-0.5" />
            Back to invoices
          </Link>
          <div className="flex items-center gap-3 mt-1.5">
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              Invoice Details: {invoice.InvoiceNumber}
            </h1>
            {getStatusBadge(invoice.Status)}
          </div>
        </div>

        <Button
          variant="outline"
          onClick={handleDownloadPDF}
          className="font-bold border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 self-end sm:self-center text-xs py-2 px-4 rounded-2xl"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Download PDF</span>
        </Button>
      </div>

      {/* Warning/Info Banners */}
      {parseFloat(invoice.CreditApplied || 0) > 0 && (
        <div className="bg-emerald-50 border border-emerald-250 text-emerald-800 rounded-3xl p-4 text-xs font-bold flex items-center gap-2.5 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>£{parseFloat(invoice.CreditApplied).toFixed(2)} account credit was automatically applied to this invoice.</span>
        </div>
      )}

      {parseFloat(invoice.PreviousBalance || 0) > 0 && (
        <div className="bg-amber-50 border border-amber-250 text-amber-800 rounded-3xl p-4 text-xs font-bold flex items-center gap-2.5 shadow-xs">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <span>£{parseFloat(invoice.PreviousBalance).toFixed(2)} carried forward from previous unpaid invoices.</span>
        </div>
      )}

      {/* Main Grid Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Summary & Line Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary Details */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
              Billing Information Summary
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-650">
              <div className="space-y-2.5">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Invoice Date:</span>
                  <span className="text-slate-800 font-bold mt-0.5 block">{formatDate(invoice.CreatedAt)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Payment Due Date:</span>
                  <span className="text-slate-800 font-bold mt-0.5 block">{formatDate(invoice.DueDate)}</span>
                </div>
              </div>

              <div className="space-y-2.5 border-t border-slate-100 sm:border-t-0 sm:pl-4">
                <div className="flex items-start gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Service Address:</span>
                    <span className="text-slate-700 font-bold block mt-0.5">{invoice.AddressLine}, {invoice.City}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-slate-500 text-[11px] pl-5.5">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(invoice.ScheduledDate)}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatTime(invoice.ScheduledStart)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
            <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100">
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">
                Line Items
              </h3>
            </div>

            <table className="w-full text-left text-xs font-semibold text-slate-650">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/60 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">
                  <th className="px-6 py-2.5">Description</th>
                  <th className="px-6 py-2.5 right-align">Quantity / Hrs</th>
                  <th className="px-6 py-2.5 right-align">Rate</th>
                  <th className="px-6 py-2.5 right-align">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {/* Base clean */}
                <tr className="hover:bg-slate-50/20">
                  <td className="px-6 py-3.5 font-bold text-slate-800">
                    Cleaning Service (Base Rate)
                  </td>
                  <td className="px-6 py-3.5 right-align">{activeHours}h</td>
                  <td className="px-6 py-3.5 right-align">{formatGBP(activeRate)}</td>
                  <td className="px-6 py-3.5 right-align font-bold text-slate-800">{formatGBP(invoice.SubTotal)}</td>
                </tr>

                {/* Extra Options */}
                {options && options.map((opt, i) => (
                  <tr key={i} className="hover:bg-slate-50/20 text-slate-500">
                    <td className="px-6 py-3.5 font-bold">
                      {opt.Name} (Option)
                    </td>
                    <td className="px-6 py-3.5 right-align">1</td>
                    <td className="px-6 py-3.5 right-align">{formatGBP(opt.Fee)}</td>
                    <td className="px-6 py-3.5 right-align font-bold text-slate-800">{formatGBP(opt.Fee)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Calculations Breakdown */}
            <div className="p-6 bg-slate-50/50 border-t border-slate-100 space-y-2 text-xs font-bold text-slate-500">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="text-slate-850">{formatGBP(invoice.SubTotal)}</span>
              </div>
              {parseFloat(invoice.ExtrasTotal || 0) > 0 && (
                <div className="flex justify-between">
                  <span>Extras (Options):</span>
                  <span className="text-slate-850">{formatGBP(invoice.ExtrasTotal)}</span>
                </div>
              )}
              {parseFloat(invoice.PreviousBalance || 0) > 0 && (
                <div className="flex justify-between text-amber-700">
                  <span>Carried Forward Balance:</span>
                  <span>+ {formatGBP(invoice.PreviousBalance)}</span>
                </div>
              )}
              {parseFloat(invoice.CreditApplied || 0) > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Applied Account Credit:</span>
                  <span>- {formatGBP(invoice.CreditApplied)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-850 text-sm font-black pt-2 border-t border-slate-200">
                <span>TOTAL:</span>
                <span>{formatGBP(invoice.Total)}</span>
              </div>
              
              {isUnpaid && (
                <div className="flex justify-between text-red-650 text-sm font-black pt-1">
                  <span>Remaining Due:</span>
                  <span>{formatGBP(invoice.RemainingAmount)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Bank details & past payments */}
        <div className="space-y-6">
          {/* Bank Instructions */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs text-left space-y-3.5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <Landmark className="w-4 h-4 text-brand-accent" />
              <span>How to Pay</span>
            </h3>
            
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              To settle this invoice, please make a bank transfer to the following account details. 
            </p>

            <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-[11px] font-semibold text-slate-650">
              <div>
                <span className="text-slate-400 block font-bold">Bank Name:</span>
                <span className="text-slate-800 font-bold block mt-0.5">Barclays Bank</span>
              </div>
              <div>
                <span className="text-slate-400 block font-bold">Account Name:</span>
                <span className="text-slate-800 font-bold block mt-0.5">BellaClean Ltd</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 block font-bold">Sort Code:</span>
                  <span className="text-slate-800 font-bold block mt-0.5">20-00-00</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold">Account Number:</span>
                  <span className="text-slate-800 font-bold block mt-0.5">12345678</span>
                </div>
              </div>
              <div>
                <span className="text-slate-400 block font-bold">Payment Reference:</span>
                <span className="text-red-650 font-black block mt-0.5">{invoice.InvoiceNumber}</span>
              </div>
              {invoice.IBAN && (
                <div>
                  <span className="text-slate-400 block font-bold">IBAN:</span>
                  <span className="text-slate-800 font-bold block mt-0.5 truncate">{invoice.IBAN}</span>
                </div>
              )}
            </div>
            
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex gap-2 text-[10px] text-slate-500 font-semibold leading-relaxed">
              <Info className="w-4 h-4 text-brand-accent shrink-0 mt-0.5" />
              <p>
                Please ensure you type the exact Invoice Number in the reference field to help us reconcile your payment.
              </p>
            </div>
          </div>

          {/* Past Payments List */}
          {payments && payments.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs text-left space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                Payments Logged
              </h3>

              <div className="divide-y divide-slate-150 space-y-2">
                {payments.map(p => (
                  <div key={p.PaymentID} className="pt-2 text-xs flex justify-between gap-2">
                    <div className="font-semibold">
                      <p className="text-slate-800 font-bold">{formatGBP(p.Amount)}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{formatDate(p.PaidAt)} via {p.Method.toUpperCase().replace('_', ' ')}</p>
                    </div>
                    {p.Reference && (
                      <span className="text-[10px] text-slate-500 font-bold bg-slate-150 px-2 py-0.5 rounded-lg h-fit">
                        Ref: {p.Reference}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerInvoiceDetailPage;
