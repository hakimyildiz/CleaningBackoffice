import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { serviceRecordService } from '../services/serviceRecordService';
import { employeeService } from '../../employees/services/employeeService';
import { useToast } from '../../../hooks/useToast';
import useAuth from '../../../hooks/useAuth';
import { ROLES } from '../../../utils/constants';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import Modal from '../../../components/common/Modal';
import { formatDate, formatTime, formatGBP } from '../../../utils/formatters';
import {
  ChevronLeft,
  Calendar,
  Clock,
  MapPin,
  User,
  DollarSign,
  Plus,
  Trash2,
  X,
  ExternalLink,
  Camera,
  Activity,
  Check,
  ChevronRight,
  FileText
} from 'lucide-react';

export const ServiceRecordDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { role } = useAuth();

  const isAdminOrManager = role === ROLES.ADMIN || role === ROLES.MANAGER;

  // State
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cleanersList, setCleanersList] = useState([]);
  const [isAssignDropdownOpen, setIsAssignDropdownOpen] = useState(false);
  
  // Modals
  const [isCancelRecordOpen, setIsCancelRecordOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  // Fetch Service Record details
  const fetchRecordDetails = useCallback(async () => {
    setLoading(true);
    try {
      const result = await serviceRecordService.getServiceRecordById(id);
      setRecord(result.data);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to load service record details.', 'error');
      navigate('/services');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, addToast]);

  // Fetch Available Cleaners
  const fetchAvailableCleaners = useCallback(async () => {
    if (!isAdminOrManager) return;
    try {
      const result = await employeeService.getEmployees({ isActive: true, limit: 1000 });
      const filtered = (result.data || []).filter(e => 
        ['cleaner', 'cleaner_manager', 'manager', 'admin'].includes(e.Role)
      );
      setCleanersList(filtered);
    } catch (err) {
      console.error('Failed to load active employees:', err.message);
    }
  }, [isAdminOrManager]);

  useEffect(() => {
    fetchRecordDetails();
    fetchAvailableCleaners();
  }, [fetchRecordDetails, fetchAvailableCleaners]);

  // Add cleaner to active ServiceRecord
  const handleAddCleaner = async (employeeId) => {
    if (!record) return;
    try {
      const currentIds = record.cleaners?.map(c => c.EmployeeID) || [];
      if (currentIds.includes(employeeId)) {
        addToast('Cleaner is already checked in to this record.', 'warning');
        return;
      }
      await serviceRecordService.addCleanerToRecord(record.ServiceRecordID, employeeId);
      addToast('Cleaner added to active service record successfully.', 'success');
      setIsAssignDropdownOpen(false);
      fetchRecordDetails();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to add cleaner to record.', 'error');
    }
  };

  // Remove cleaner from active ServiceRecord
  const handleRemoveCleaner = async (employeeId) => {
    if (!record) return;
    if (!window.confirm('Are you sure you want to remove this cleaner from the service record?')) return;
    try {
      await serviceRecordService.removeCleanerFromRecord(record.ServiceRecordID, employeeId);
      addToast('Cleaner removed from service record.', 'success');
      fetchRecordDetails();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to remove cleaner from record.', 'error');
    }
  };

  // Cancel record
  const handleCancelRecord = async () => {
    if (!record) return;
    setModalLoading(true);
    try {
      await serviceRecordService.cancelServiceRecord(record.ServiceRecordID);
      addToast('Service record and associated draft invoice cancelled.', 'success');
      setIsCancelRecordOpen(false);
      fetchRecordDetails();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to cancel service record.', 'error');
    } finally {
      setModalLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const base = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border uppercase';
    switch (status) {
      case 'scheduled':
        return <span className={`${base} bg-blue-50 border-blue-200 text-blue-500`}>Scheduled</span>;
      case 'in_progress':
        return <span className={`${base} bg-purple-50 border-purple-200 text-purple-600 animate-pulse`}><Activity className="w-3.5 h-3.5" />In Progress</span>;
      case 'completed':
        return <span className={`${base} bg-emerald-50 border-emerald-200 text-emerald-500`}>Completed</span>;
      case 'cancelled':
        return <span className={`${base} bg-slate-150 border-slate-250 text-slate-400 line-through`}>Cancelled</span>;
      case 'skipped':
        return <span className={`${base} bg-slate-50 border-slate-250 text-slate-400`}>Skipped</span>;
      case 'missed':
        return <span className={`${base} bg-red-50 border-red-200 text-red-500`}>Missed</span>;
      case 'invoice_sent':
        return <span className={`${base} bg-cyan-50 border-cyan-200 text-cyan-600`}>Invoice Sent</span>;
      case 'paid':
        return <span className={`${base} bg-emerald-50 border-emerald-200 text-emerald-600`}>Paid</span>;
      default:
        return <span className={`${base} bg-slate-50 border-slate-200 text-slate-500`}>{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-accent border-r-2" />
      </div>
    );
  }

  if (!record) return null;

  const ownerName = record.CustomerID
    ? `${record.CustomerFirstName} ${record.CustomerSureName}`
    : record.AgencyName;

  const propertyTypeDisplay = record.PropertyType
    ? record.PropertyType.charAt(0).toUpperCase() + record.PropertyType.slice(1)
    : 'Other';

  const isEditable = record.Status === 'in_progress';
  const hasInvoice = record.invoice !== null;

  return (
    <div className="space-y-6 text-left max-w-5xl mx-auto">
      {/* Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="space-y-1">
          <Link
            to={`/services/${record.ServiceID}`}
            className="inline-flex items-center text-xs font-bold text-slate-400 hover:text-slate-650 uppercase tracking-wider transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-0.5" />
            Back to Contract Details
          </Link>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              Service Record #{String(record.ServiceRecordID).padStart(5, '0')}
            </h1>
            {getStatusBadge(record.Status)}
          </div>
        </div>

        {/* Cancel actions */}
        {isAdminOrManager && ['in_progress', 'completed'].includes(record.Status) && (!hasInvoice || ['draft', 'cancelled'].includes(record.invoice?.Status)) && (
          <Button
            variant="outline"
            onClick={() => setIsCancelRecordOpen(true)}
            className="font-bold text-red-500 border-red-200 hover:bg-red-50 flex items-center gap-1.5 shadow-xs"
          >
            <Trash2 className="w-4 h-4" />
            <span>Cancel Record</span>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details & Timesheets */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary Card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-brand-primary border-b border-slate-100 pb-2">
              Service Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-600">
              <div className="space-y-2">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Owner Account:</span>
                  <span className="text-sm font-bold text-slate-800 mt-0.5 block">{ownerName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Service Address:</span>
                  <span className="text-slate-700 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    {record.AddressLine}, {record.City}, {record.PostCode}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Scheduled Appointment:</span>
                  <span className="text-slate-700 flex items-center gap-1.5 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {formatDate(record.ScheduledDate)} at {formatTime(record.ScheduledStart)}
                  </span>
                </div>
                <div className="flex gap-4">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Est. Hours:</span>
                    <span className="text-slate-700 font-bold">{parseFloat(record.EstimatedHours || 0).toFixed(1)} hrs</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Actual Onsite Hours:</span>
                    <span className="text-slate-800 font-bold">{record.ActualHours ? `${parseFloat(record.ActualHours).toFixed(1)} hrs` : '—'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Timesheets Section */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-800">
                Staff Check-in Timesheets
              </h3>

              {/* Add cleaner option for in_progress records */}
              {isEditable && isAdminOrManager && (
                <div className="relative">
                  <Button
                    onClick={() => setIsAssignDropdownOpen(!isAssignDropdownOpen)}
                    variant="outline"
                    className="font-bold flex items-center gap-1 px-2.5 py-1 text-[11px] shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Cleaner</span>
                  </Button>

                  {isAssignDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 max-h-48 bg-white border border-slate-200 rounded-xl shadow-lg overflow-y-auto z-20">
                      <div className="divide-y divide-slate-100">
                        {cleanersList.length === 0 ? (
                          <div className="p-2 text-xs text-slate-400 italic">No cleaners available.</div>
                        ) : (
                          cleanersList.map((emp) => (
                            <button
                              key={emp.EmployeeID}
                              onClick={() => handleAddCleaner(emp.EmployeeID)}
                              className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-xs font-semibold text-slate-700"
                            >
                              {emp.FirstName} {emp.SureName}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cleaner timesheet rows */}
            {record.cleaners?.length === 0 ? (
              <p className="text-xs text-slate-450 italic py-4">No cleaner checked in to this record.</p>
            ) : (
              <div className="divide-y divide-slate-150">
                {record.cleaners?.map((cleaner) => {
                  const initials = `${cleaner.FirstName.charAt(0)}${cleaner.SureName.charAt(0)}`.toUpperCase();
                  const gpsInLink = cleaner.CheckInLat && cleaner.CheckInLng ? `https://maps.google.com/?q=${cleaner.CheckInLat},${cleaner.CheckInLng}` : null;
                  const gpsOutLink = cleaner.CheckOutLat && cleaner.CheckOutLng ? `https://maps.google.com/?q=${cleaner.CheckOutLat},${cleaner.CheckOutLng}` : null;

                  return (
                    <div key={cleaner.ServiceRecordCleanerID} className="py-3.5 first:pt-0 last:pb-0 space-y-2 text-xs font-semibold">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-brand-primary/10 text-brand-primary flex items-center justify-center rounded-full text-[10px] font-black">
                            {initials}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 text-sm block">{cleaner.FirstName} {cleaner.SureName}</span>
                            <span className="text-[10px] text-slate-400 block">Username: @{cleaner.Username || 'N/A'}</span>
                          </div>
                        </div>

                        {/* Remove button for active jobs */}
                        {isEditable && isAdminOrManager && (
                          <button
                            onClick={() => handleRemoveCleaner(cleaner.EmployeeID)}
                            className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-650 rounded-lg transition-colors"
                            title="Remove cleaner check-in"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-9">
                        <div className="space-y-1 text-slate-650 font-medium">
                          <div>Check-in: <strong className="text-slate-850">{cleaner.CheckIn ? `${formatDate(cleaner.CheckIn)} ${formatTime(cleaner.CheckIn)}` : '—'}</strong></div>
                          <div>Check-out: <strong className="text-slate-850">{cleaner.CheckOut ? `${formatDate(cleaner.CheckOut)} ${formatTime(cleaner.CheckOut)}` : '—'}</strong></div>
                          <div>Clean hours: <strong className="text-slate-800">{cleaner.ActualHours !== null ? `${cleaner.ActualHours} hrs` : '—'}</strong></div>
                        </div>

                        <div className="space-y-1 text-brand-primary text-[10px] font-bold">
                          {gpsInLink && (
                            <div>
                              <a href={gpsInLink} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-0.5">
                                📍 Check-in GPS Location <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </div>
                          )}
                          {gpsOutLink && (
                            <div className="pt-0.5">
                              <a href={gpsOutLink} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-0.5">
                                📍 Check-out GPS Location <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      {cleaner.Note && (
                        <div className="pl-9 mt-1.5">
                          <p className="text-xs text-slate-500 bg-slate-50 border border-slate-100 p-2.5 rounded-xl font-medium italic">
                            Cleaner note: "{cleaner.Note}"
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Invoice Status & Photos */}
        <div className="space-y-6">
          {/* Invoice card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-brand-primary border-b border-slate-100 pb-2">
              Billing Invoice
            </h3>

            {hasInvoice ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Invoice No:</span>
                  <span className="text-sm font-black text-slate-800">{record.invoice.InvoiceNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Total Charged:</span>
                  <span className="text-sm font-black text-teal-650">{formatGBP(record.invoice.Total)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Status:</span>
                  <Badge 
                    variant={
                      record.invoice.Status === 'paid' ? 'success' : 
                      record.invoice.Status === 'draft' ? 'warning' : 'primary'
                    }
                    className="uppercase tracking-wider text-[10px]"
                  >
                    {record.invoice.Status}
                  </Badge>
                </div>
                <Link
                  to={`/invoices/${record.invoice.InvoiceID}`}
                  className="w-full text-center py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all border border-slate-200 mt-2 block"
                >
                  Go to Invoice details
                </Link>
              </div>
            ) : (
              <div className="text-center py-4 text-xs text-slate-400 italic">
                {record.Status === 'in_progress'
                  ? 'Invoice will be generated automatically on checkout.'
                  : 'No invoice linked to this record.'}
              </div>
            )}
          </div>

          {/* Photo gallery */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-brand-primary border-b border-slate-100 pb-2">
              Service Photos ({record.photos?.length || 0})
            </h3>

            {!record.photos || record.photos.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs font-semibold flex flex-col items-center gap-1.5">
                <Camera className="w-6 h-6 text-slate-300" />
                <span>No photos uploaded.</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                {record.photos.map((photo, index) => {
                  const url = `${import.meta.env.VITE_API_URL || ''}/${photo.DriveURL}`;
                  return (
                    <div 
                      key={photo.ServicePhotoID}
                      className="relative aspect-square rounded-xl border border-slate-200 overflow-hidden cursor-pointer hover:opacity-90 transition-all shadow-xs"
                      onClick={() => setLightboxIndex(index)}
                    >
                      <img src={url} alt="Checklist" className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 right-1 px-1 bg-black/60 text-white rounded text-[8px] font-black uppercase tracking-wider">
                        {photo.PhotoType}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Service Record Confirmation Modal */}
      <Modal
        isOpen={isCancelRecordOpen}
        onClose={() => setIsCancelRecordOpen(false)}
        title="Cancel Service Record"
        onConfirm={handleCancelRecord}
        confirmText="Cancel Record"
        confirmVariant="danger"
        isLoading={modalLoading}
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-red-650 bg-red-50 border border-red-100 p-3 rounded-xl">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span className="text-xs font-semibold">Warning: This will set status to cancelled and discard the draft invoice.</span>
          </div>
          <p className="text-sm text-slate-650">
            Are you sure you want to cancel service record <strong>#{String(record.ServiceRecordID).padStart(5, '0')}</strong>?
          </p>
        </div>
      </Modal>

      {/* Photo Lightbox */}
      {lightboxIndex !== null && record.photos && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between items-center p-4">
          <div className="w-full flex justify-between items-center text-white py-2">
            <span className="text-xs font-bold font-mono">
              Photo {lightboxIndex + 1} of {record.photos.length} ({record.photos[lightboxIndex].PhotoType.toUpperCase()})
            </span>
            <button
              onClick={() => setLightboxIndex(null)}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 flex justify-center items-center w-full max-h-[85vh]">
            <img
              src={`${import.meta.env.VITE_API_URL || ''}/${record.photos[lightboxIndex].DriveURL}`}
              alt="Clean checklist preview"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>

          <div className="w-full flex justify-center gap-4 py-3">
            <Button
              disabled={lightboxIndex === 0}
              onClick={() => setLightboxIndex(prev => prev - 1)}
              variant="outline"
              className="text-white border-white/25 hover:bg-white/10"
            >
              Previous
            </Button>
            <Button
              disabled={lightboxIndex === record.photos.length - 1}
              onClick={() => setLightboxIndex(prev => prev + 1)}
              variant="outline"
              className="text-white border-white/25 hover:bg-white/10"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceRecordDetailPage;
