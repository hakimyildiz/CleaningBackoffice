import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import invoiceService from '../services/invoiceService';
import InvoiceDraftEditor from '../components/InvoiceDraftEditor';
import InvoiceStatusBadge from '../components/InvoiceStatusBadge';
import Button from '../../../components/common/Button';
import Modal from '../../../components/common/Modal';
import { useToast } from '../../../hooks/useToast';
import useAuth from '../../../hooks/useAuth';
import { ROLES } from '../../../utils/constants';
import paymentService from '../../payments/services/paymentService';
import RecordPaymentModal from '../../payments/components/RecordPaymentModal';
import { formatDate, formatTime, formatGBP } from '../../../utils/formatters';
import { ChevronLeft, CheckCircle2, XCircle, Calendar, Clock, MapPin, Map, ZoomIn, ChevronRight, FileText, Mail, Plus, Trash2, AlertCircle } from 'lucide-react';

export const InvoiceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const { role } = useAuth();
  const isAdmin = role === ROLES.ADMIN;

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Modals state
  const [activeModal, setActiveModal] = useState(null); // 'approve' | 'cancel' | 'send_email' | null
  const [lightboxIndex, setLightboxIndex] = useState(null); // index of photo or null

  // Payments states
  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [emailSending, setEmailSending] = useState(false);

  const fetchInvoiceDetails = async () => {
    setLoading(true);
    try {
      const result = await invoiceService.getInvoiceById(id);
      setInvoice(result.data);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to load invoice details.', 'error');
      navigate('/invoices');
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    setPaymentsLoading(true);
    try {
      const result = await paymentService.getInvoicePayments(id);
      setPayments(result.data || []);
    } catch (err) {
      console.error('Failed to load invoice payments:', err);
    } finally {
      setPaymentsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoiceDetails();
    fetchPayments();
  }, [id]);

  const handleUpdateInvoice = async (formData) => {
    setSaving(true);
    try {
      const result = await invoiceService.updateInvoice(id, formData);
      setInvoice(result.data);
      addToast('Invoice draft updated successfully.', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save invoice overrides.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await invoiceService.approveInvoice(id);
      addToast(`Invoice Approved and marked as Sent.`, 'success');
      setActiveModal(null);
      fetchInvoiceDetails();
      fetchPayments();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to approve invoice.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    setActionLoading(true);
    try {
      await invoiceService.cancelInvoice(id);
      addToast(`Invoice cancelled successfully.`, 'success');
      setActiveModal(null);
      fetchInvoiceDetails();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to cancel invoice.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const api = (await import('../../../config/api')).default;
      const response = await api.get(`/invoices/${id}/pdf`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice-${invoice.InvoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addToast('Invoice PDF downloaded successfully.', 'success');
    } catch (err) {
      addToast('Failed to download invoice PDF.', 'error');
    }
  };

  const handleSendInvoiceEmail = async () => {
    setEmailSending(true);
    try {
      await invoiceService.sendInvoiceEmail(id);
      addToast('Invoice email successfully sent with PDF attachment.', 'success');
      setActiveModal(null);
      fetchInvoiceDetails();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to send invoice email.', 'error');
    } finally {
      setEmailSending(false);
    }
  };

  const handleRecordPayment = async (paymentData) => {
    setRecordingPayment(true);
    try {
      await paymentService.recordPayment(id, paymentData);
      addToast('Payment recorded successfully.', 'success');
      setIsPaymentModalOpen(false);
      fetchInvoiceDetails();
      fetchPayments();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to record payment.', 'error');
    } finally {
      setRecordingPayment(false);
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm('Are you sure you want to delete this payment?')) return;
    try {
      await paymentService.deletePayment(paymentId);
      addToast('Payment record deleted, invoice balance adjusted.', 'success');
      fetchInvoiceDetails();
      fetchPayments();
    } catch (err) {
      addToast('Failed to delete payment.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-accent border-r-2" />
      </div>
    );
  }

  if (!invoice) return null;

  const isDraft = invoice.Status === 'draft';
  const ownerName = invoice.CustomerID 
    ? `${invoice.CustomerFirstName} ${invoice.CustomerSureName}`
    : invoice.AgencyName;

  const cleaners = invoice.serviceRecord?.cleaners || [];
  const photos = invoice.serviceRecord?.photos || [];

  return (
    <div className="space-y-6 text-left max-w-5xl mx-auto">
      {/* Breadcrumb & Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="space-y-1">
          <Link
            to="/invoices"
            className="inline-flex items-center text-xs font-bold text-slate-400 hover:text-slate-650 uppercase tracking-wider transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-0.5" />
            Back to invoices
          </Link>
          <div className="flex items-center gap-3 mt-1.5">
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              Invoice Details: {invoice.InvoiceNumber}
            </h1>
            <InvoiceStatusBadge status={invoice.Status} />
          </div>
        </div>

        {/* Action Controls for drafts */}
        {isDraft && (
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setActiveModal('cancel')}
              className="font-bold text-red-500 border-red-200 hover:bg-red-50 flex items-center gap-1.5"
            >
              <XCircle className="w-4 h-4" />
              <span>Cancel Draft</span>
            </Button>
            <Button
              variant="primary"
              onClick={() => setActiveModal('approve')}
              className="font-bold bg-emerald-600 hover:bg-emerald-700 border-emerald-600 shadow-sm flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Approve & Send</span>
            </Button>
          </div>
        )}

        {/* Action Controls for approved invoices */}
        {!isDraft && invoice.Status !== 'cancelled' && (
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleDownloadPDF}
              className="font-bold border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4" />
              <span>Download PDF</span>
            </Button>
            {(invoice.Status === 'sent' || invoice.Status === 'overdue') && (
              <Button
                variant="primary"
                onClick={() => setActiveModal('send_email')}
                className="font-bold bg-brand-primary hover:bg-brand-primary/95 flex items-center gap-1.5 shadow-sm text-white border-brand-primary"
              >
                <Mail className="w-4 h-4" />
                <span>Send Invoice</span>
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Editor + Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1 — Invoice Summary */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-brand-primary border-b border-slate-100 pb-2">
              Billing Information Summary
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-650">
              <div className="space-y-2">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Client Account:</span>
                  <span className="text-sm font-bold text-slate-800 mt-0.5 block">{ownerName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Due Date:</span>
                  <span className="text-slate-700">{formatDate(invoice.DueDate)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Created At:</span>
                  <span className="text-slate-700">{formatDate(invoice.CreatedAt)}</span>
                </div>
                {invoice.SentAt && (
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Sent At:</span>
                    <span className="text-slate-700">{formatDate(invoice.SentAt)} {formatTime(invoice.SentAt)}</span>
                  </div>
                )}
              </div>
            </div>

            {invoice.serviceRecord && (
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-3">
                <div className="space-y-1 text-xs font-semibold">
                  <div className="flex items-center gap-1.5 font-bold text-slate-750">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{invoice.serviceRecord.AddressLine}, {invoice.serviceRecord.City}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500 font-medium pl-5.5">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(invoice.serviceRecord.ScheduledDate)}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatTime(invoice.serviceRecord.ScheduledStart)}</span>
                  </div>
                </div>
                <Link
                  to={`/services/${invoice.serviceRecord.ServiceID}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-brand-accent hover:text-brand-primary uppercase tracking-wider"
                >
                  <span>View Contract</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>

          {/* Credit & Balance alerts */}
          {parseFloat(invoice.CreditApplied || 0) > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-3xl p-4 text-xs font-bold flex items-center gap-2.5 shadow-xs">
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

          {/* Section 2 — Editor panel */}
          <InvoiceDraftEditor
            invoice={invoice}
            onSave={handleUpdateInvoice}
            isSaving={saving}
          />

          {/* Section 3 — Cleaners on this job */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-brand-primary border-b border-slate-100 pb-2">
              Crew Timesheets & Check-in Details
            </h3>

            {cleaners.length === 0 ? (
              <p className="text-xs text-slate-450 italic py-4">No cleaner check-in logs registered for this clean.</p>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[500px] text-left text-xs font-semibold text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200/60 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-2.5">Cleaner Name</th>
                      <th className="px-4 py-2.5">Check-in</th>
                      <th className="px-4 py-2.5">Check-out</th>
                      <th className="px-4 py-2.5 text-center">Hours Worked</th>
                      <th className="px-4 py-2.5">GPS (In/Out)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cleaners.map((c) => {
                      const gpsInLink = c.CheckInLat && c.CheckInLng ? `https://maps.google.com/?q=${c.CheckInLat},${c.CheckInLng}` : null;
                      const gpsOutLink = c.CheckOutLat && c.CheckOutLng ? `https://maps.google.com/?q=${c.CheckOutLat},${c.CheckOutLng}` : null;
                      
                      return (
                        <React.Fragment key={c.ServiceRecordCleanerID}>
                          <tr className="bg-slate-50/10">
                            <td className="px-4 py-3 font-bold text-slate-800">{c.FirstName} {c.SureName}</td>
                            <td className="px-4 py-3 text-slate-500">{c.CheckIn ? `${formatDate(c.CheckIn)} ${formatTime(c.CheckIn)}` : '—'}</td>
                            <td className="px-4 py-3 text-slate-500">{c.CheckOut ? `${formatDate(c.CheckOut)} ${formatTime(c.CheckOut)}` : '—'}</td>
                            <td className="px-4 py-3 text-center font-bold text-slate-700">{c.ActualHours !== null ? `${c.ActualHours}h` : '—'}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                {gpsInLink ? (
                                  <a href={gpsInLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-[10px] text-brand-accent hover:underline" title="View Checkin Map">
                                    <Map className="w-3.5 h-3.5" />
                                    <span>In</span>
                                  </a>
                                ) : <span className="text-[10px] text-slate-355">In: —</span>}
                                {gpsOutLink ? (
                                  <a href={gpsOutLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-[10px] text-brand-accent hover:underline" title="View Checkout Map">
                                    <Map className="w-3.5 h-3.5" />
                                    <span>Out</span>
                                  </a>
                                ) : <span className="text-[10px] text-slate-355">Out: —</span>}
                              </div>
                            </td>
                          </tr>
                          {c.Note && (
                            <tr>
                              <td colSpan="5" className="px-8 py-2 bg-amber-50/15 border-t border-b border-slate-50 text-[11px] text-slate-500 font-medium italic">
                                <span className="font-bold text-slate-600 block">Note left:</span>
                                "{c.Note}"
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 4 — Payments Recorded */}
          {invoice.Status !== 'draft' && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-brand-primary">
                  Payments Recorded
                </h3>
                {invoice.Status !== 'paid' && invoice.Status !== 'cancelled' && invoice.Status !== 'forwarded' && (
                  <Button
                    variant="primary"
                    onClick={() => setIsPaymentModalOpen(true)}
                    className="text-xs py-1 px-3 flex items-center gap-1 font-bold shadow-xs bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Record Payment</span>
                  </Button>
                )}
              </div>

              {paymentsLoading ? (
                <div className="flex justify-center py-6">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-brand-accent border-r-2" />
                </div>
              ) : payments.length === 0 ? (
                <p className="text-xs text-slate-450 italic py-4">No payments recorded for this invoice yet.</p>
              ) : (
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left text-xs font-semibold text-slate-650 border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200/60 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-2.5">Date</th>
                        <th className="px-4 py-2.5">Amount</th>
                        <th className="px-4 py-2.5">Method</th>
                        <th className="px-4 py-2.5">Reference</th>
                        <th className="px-4 py-2.5">Recorded By</th>
                        {isAdmin && <th className="px-4 py-2.5 text-right">Action</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payments.map((p) => (
                        <tr key={p.PaymentID} className="hover:bg-slate-50/10 transition-colors">
                          <td className="px-4 py-3 text-slate-500">{formatDate(p.PaidAt)}</td>
                          <td className="px-4 py-3 font-bold text-slate-900">{formatGBP(p.Amount)}</td>
                          <td className="px-4 py-3 text-slate-500 uppercase">{p.Method.replace('_', ' ')}</td>
                          <td className="px-4 py-3 text-slate-500">{p.Reference || '—'}</td>
                          <td className="px-4 py-3 text-slate-500">
                            {p.RecordedByFirstName ? `${p.RecordedByFirstName} ${p.RecordedBySureName}` : 'System'}
                          </td>
                          {isAdmin && (
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => handleDeletePayment(p.PaymentID)}
                                className="p-1 hover:text-red-500 text-slate-450 rounded-lg hover:bg-red-50"
                                title="Delete Payment"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs font-bold text-slate-500 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/60 mt-4">
                    <span>Invoice Total: {formatGBP(invoice.Total)}</span>
                    <span>Total Paid: {formatGBP(payments.reduce((sum, p) => sum + parseFloat(p.Amount), 0))}</span>
                    <span className="text-red-600 text-sm font-black">Remaining Due: {formatGBP(invoice.RemainingAmount)}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right 1 Col: Photo uploads */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4 h-fit">
          <h3 className="text-sm font-bold text-brand-primary border-b border-slate-100 pb-2">
            Service Photos ({photos.length})
          </h3>
          
          {photos.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs font-semibold">
              No photos uploaded for this clean.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {photos.map((p, index) => {
                const fileUrl = p.DriveURL.startsWith('http') ? p.DriveURL : `/${p.DriveURL}`;
                
                return (
                  <div 
                    key={p.ServicePhotoID} 
                    className="relative group border border-slate-200 rounded-xl overflow-hidden cursor-pointer shadow-xs hover:shadow-sm transition-all duration-200"
                    onClick={() => setLightboxIndex(index)}
                  >
                    <img 
                      src={fileUrl} 
                      alt={`Clean photo ${p.PhotoType}`} 
                      className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    
                    <div className="absolute top-1 left-1 bg-slate-900/60 backdrop-blur-xs text-[9px] font-black uppercase text-white px-1.5 py-0.5 rounded border border-white/10">
                      {p.PhotoType}
                    </div>

                    <div className="absolute inset-0 bg-slate-950/25 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ZoomIn className="w-5 h-5 text-white drop-shadow-sm" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox full-screen overlay */}
      {lightboxIndex !== null && (
        <div 
          className="fixed inset-0 bg-slate-950/95 flex items-center justify-center z-50 p-4 transition-all duration-200"
          onClick={() => setLightboxIndex(null)}
        >
          <button 
            onClick={() => setLightboxIndex(null)}
            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <XCircle className="w-7 h-7" />
          </button>

          {/* Navigation Controls */}
          {lightboxIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(prev => prev - 1); }}
              className="absolute left-6 p-3 bg-white/5 hover:bg-white/10 rounded-full text-white font-bold"
            >
              &larr;
            </button>
          )}

          {lightboxIndex < photos.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(prev => prev + 1); }}
              className="absolute right-6 p-3 bg-white/5 hover:bg-white/10 rounded-full text-white font-bold"
            >
              &rarr;
            </button>
          )}

          <div className="max-w-3xl max-h-[80vh] flex flex-col items-center gap-3" onClick={e => e.stopPropagation()}>
            <img 
              src={photos[lightboxIndex].DriveURL.startsWith('http') ? photos[lightboxIndex].DriveURL : `/${photos[lightboxIndex].DriveURL}`}
              alt="Lightbox" 
              className="max-w-full max-h-[70vh] rounded-2xl shadow-2xl object-contain border border-white/10"
            />
            <div className="text-center text-white space-y-1">
              <span className="inline-block px-2.5 py-0.5 bg-brand-accent/20 border border-brand-accent/35 text-brand-accent rounded text-[10px] font-black uppercase tracking-wider">
                Photo Type: {photos[lightboxIndex].PhotoType}
              </span>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                Uploaded at: {formatDate(photos[lightboxIndex].UploadedAt)} {formatTime(photos[lightboxIndex].UploadedAt)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Approval Modal Confirmation */}
      <Modal
        isOpen={activeModal === 'approve'}
        onClose={() => setActiveModal(null)}
        title="Approve & Send Invoice"
        onConfirm={handleApprove}
        confirmText="Approve"
        confirmVariant="primary"
        isLoading={actionLoading}
      >
        <p className="text-slate-650">
          Are you sure you want to approve invoice <strong>{invoice.InvoiceNumber}</strong>?
        </p>
        <p className="mt-2 text-xs text-slate-450">
          This will finalize override calculations, change status to "Sent", and mark the linked clean record as invoiced.
        </p>
      </Modal>

      {/* Invoice Cancellation Modal Confirmation */}
      <Modal
        isOpen={activeModal === 'cancel'}
        onClose={() => setActiveModal(null)}
        title="Cancel Draft Invoice"
        onConfirm={handleCancel}
        confirmText="Cancel Invoice"
        confirmVariant="danger"
        isLoading={actionLoading}
      >
        <p className="text-slate-650">
          Are you sure you want to cancel invoice <strong>{invoice.InvoiceNumber}</strong>?
        </p>
        <p className="mt-2 text-xs text-slate-450">
          This will set the status of this draft invoice to "Cancelled". This action is irreversible.
        </p>
      </Modal>

      {/* Send Email Modal Confirmation */}
      <Modal
        isOpen={activeModal === 'send_email'}
        onClose={() => setActiveModal(null)}
        title="Email Invoice to Client"
        onConfirm={handleSendInvoiceEmail}
        confirmText="Send Email"
        confirmVariant="primary"
        isLoading={emailSending}
      >
        <p className="text-slate-650 text-sm">
          Are you sure you want to email invoice <strong>{invoice.InvoiceNumber}</strong> to the client's email address?
        </p>
        <p className="mt-2 text-xs text-slate-450">
          This will generate the latest invoice PDF and attach it to the email along with a direct portal link.
        </p>
      </Modal>

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        invoice={invoice}
        onRecord={handleRecordPayment}
        isLoading={recordingPayment}
      />
    </div>
  );
};

export default InvoiceDetailPage;
