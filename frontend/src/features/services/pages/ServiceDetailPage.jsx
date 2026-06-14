import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { serviceService } from '../services/serviceService';
import { serviceRecordService } from '../../serviceRecords/services/serviceRecordService';
import { employeeService } from '../../employees/services/employeeService';
import { useToast } from '../../../hooks/useToast';
import useAuth from '../../../hooks/useAuth';
import { ROLES } from '../../../utils/constants';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import Modal from '../../../components/common/Modal';
import Pagination from '../../../components/common/Pagination';
import { formatDate, formatTime, formatGBP } from '../../../utils/formatters';
import {
  ChevronLeft,
  Calendar,
  MapPin,
  User,
  DollarSign,
  Clock,
  Plus,
  Trash2,
  X,
  ExternalLink,
  Check,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  AlertTriangle,
  Camera,
  Activity
} from 'lucide-react';

export const ServiceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { role } = useAuth();

  const isAdminOrManager = role === ROLES.ADMIN || role === ROLES.MANAGER;

  // State
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'history'

  // Tab 1: Upcoming Schedule State
  const [upcomingSchedule, setUpcomingSchedule] = useState([]);
  const [scheduleCleaners, setScheduleCleaners] = useState([]);
  const [cleanersList, setCleanersList] = useState([]);
  const [isAssignDropdownOpen, setIsAssignDropdownOpen] = useState(false);
  const [upcomingLoading, setUpcomingLoading] = useState(false);
  const [scheduleFilters, setScheduleFilters] = useState({
    startDate: '',
    endDate: '',
    status: 'All'
  });

  // Tab 2: Service History State
  const [historyRecords, setHistoryRecords] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyTotalPages, setHistoryTotalPages] = useState(0);
  const [expandedHistoryRow, setExpandedHistoryRow] = useState(null);

  // Modals
  const [isCancelRowOpen, setIsCancelRowOpen] = useState(false);
  const [isMarkMissedOpen, setIsMarkMissedOpen] = useState(false);
  const [isCancelRecordOpen, setIsCancelRecordOpen] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Lightbox
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [lightboxPhotos, setLightboxPhotos] = useState([]);

  // Fetch Service Basic Info
  const fetchServiceDetails = useCallback(async () => {
    setLoading(true);
    try {
      const result = await serviceService.getServiceById(id);
      setService(result.data);
      // Fetch cleaners assigned to schedule rule
      if (result.data.scheduleRule) {
        const cleanersRes = await serviceRecordService.getScheduleCleaners(result.data.scheduleRule.ServiceScheduleID);
        setScheduleCleaners(cleanersRes.data || []);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to load service details.', 'error');
      navigate('/services');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, addToast]);

  // Fetch Available Cleaners (for assignment)
  const fetchAvailableCleaners = useCallback(async () => {
    if (!isAdminOrManager) return;
    try {
      const result = await employeeService.getEmployees({ isActive: true, limit: 1000 });
      // Filter roles cleaner, cleaner_manager, manager, admin
      const filtered = (result.data || []).filter(e => 
        ['cleaner', 'cleaner_manager', 'manager', 'admin'].includes(e.Role)
      );
      setCleanersList(filtered);
    } catch (err) {
      console.error('Failed to load cleaners:', err.message);
    }
  }, [isAdminOrManager]);

  // Fetch Upcoming Occurrences
  const fetchUpcomingOccurrences = useCallback(async () => {
    setUpcomingLoading(true);
    try {
      const result = await serviceService.getServiceSchedule(id);
      let list = result.data || [];

      // Filter on frontend for flexibility/speed
      if (scheduleFilters.startDate) {
        const start = new Date(scheduleFilters.startDate).getTime();
        list = list.filter(o => new Date(o.ScheduledDate).getTime() >= start);
      }
      if (scheduleFilters.endDate) {
        const end = new Date(scheduleFilters.endDate).getTime();
        list = list.filter(o => new Date(o.ScheduledDate).getTime() <= end);
      }
      if (scheduleFilters.status !== 'All') {
        list = list.filter(o => o.Status === scheduleFilters.status.toLowerCase());
      }

      setUpcomingSchedule(list);
    } catch (err) {
      addToast('Failed to load upcoming schedule.', 'error');
    } finally {
      setUpcomingLoading(false);
    }
  }, [id, scheduleFilters, addToast]);

  // Fetch History Records (Paginated)
  const fetchHistoryRecords = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const result = await serviceService.getServiceHistory(id, {
        page: historyPage,
        limit: 10
      });
      setHistoryRecords(result.data || []);
      setHistoryTotal(result.pagination?.total || 0);
      setHistoryTotalPages(result.pagination?.totalPages || 0);
    } catch (err) {
      addToast('Failed to load service history records.', 'error');
    } finally {
      setHistoryLoading(false);
    }
  }, [id, historyPage, addToast]);

  // Load everything on mount/update
  useEffect(() => {
    fetchServiceDetails();
    fetchAvailableCleaners();
  }, [fetchServiceDetails, fetchAvailableCleaners]);

  useEffect(() => {
    if (activeTab === 'upcoming') {
      fetchUpcomingOccurrences();
    } else {
      fetchHistoryRecords();
    }
  }, [activeTab, fetchUpcomingOccurrences, fetchHistoryRecords, historyPage]);

  // Toggle RequireCheckoutPhoto
  const handleTogglePhotoRequirement = async () => {
    if (!isAdminOrManager || !service) return;
    try {
      const updatedPhotoReq = service.RequireCheckoutPhoto === 1 ? 0 : 1;
      const updatedData = {
        ...service,
        RequireCheckoutPhoto: updatedPhotoReq,
        Frequency: service.scheduleRule?.Frequency || 'weekly',
        DayOfWeek: service.scheduleRule?.DayOfWeek || 'Mon',
        DayOfMonth: service.scheduleRule?.DayOfMonth || 1,
        StartTime: service.scheduleRule?.StartTime || '09:00',
        EstimatedHours: service.scheduleRule?.EstimatedHours || '2.0',
        StartDate: service.scheduleRule?.StartDate || new Date().toISOString().substring(0,10)
      };
      
      await serviceService.updateService(service.ServiceID, updatedData);
      setService(prev => ({ ...prev, RequireCheckoutPhoto: updatedPhotoReq }));
      addToast('Checkout photo requirement updated successfully.', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update photo requirement.', 'error');
    }
  };

  // Assign employee to schedule rule
  const handleAssignCleaner = async (employeeId) => {
    if (!service?.scheduleRule) return;
    try {
      const currentIds = scheduleCleaners.map(c => c.EmployeeID);
      if (currentIds.includes(employeeId)) {
        addToast('Cleaner already assigned.', 'warning');
        return;
      }
      const newIds = [...currentIds, employeeId];
      await serviceRecordService.assignCleanersToSchedule(service.scheduleRule.ServiceScheduleID, newIds);
      addToast('Cleaner assigned successfully.', 'success');
      setIsAssignDropdownOpen(false);
      // Reload cleaners list
      const cleanersRes = await serviceRecordService.getScheduleCleaners(service.scheduleRule.ServiceScheduleID);
      setScheduleCleaners(cleanersRes.data || []);
    } catch (err) {
      addToast('Failed to assign cleaner.', 'error');
    }
  };

  // Remove employee from schedule rule
  const handleRemoveCleaner = async (employeeId) => {
    if (!service?.scheduleRule) return;
    if (!window.confirm('Are you sure you want to remove this cleaner from the schedule?')) return;
    try {
      await serviceRecordService.removeCleanerFromSchedule(service.scheduleRule.ServiceScheduleID, employeeId);
      addToast('Cleaner removed successfully.', 'success');
      setScheduleCleaners(prev => prev.filter(c => c.EmployeeID !== employeeId));
    } catch (err) {
      addToast('Failed to remove cleaner.', 'error');
    }
  };

  // Manual Status modification
  const handleCancelRow = async () => {
    if (!selectedRecordId) return;
    setModalLoading(true);
    try {
      await serviceRecordService.updateScheduleStatus(selectedRecordId, 'cancelled');
      addToast('Schedule row marked as cancelled.', 'success');
      setIsCancelRowOpen(false);
      fetchUpcomingOccurrences();
    } catch (err) {
      addToast('Failed to cancel scheduled appointment.', 'error');
    } finally {
      setModalLoading(false);
      setSelectedRecordId(null);
    }
  };

  const handleMarkMissed = async () => {
    if (!selectedRecordId) return;
    setModalLoading(true);
    try {
      await serviceRecordService.updateScheduleStatus(selectedRecordId, 'missed');
      addToast('Schedule row marked as missed.', 'success');
      setIsMarkMissedOpen(false);
      fetchUpcomingOccurrences();
    } catch (err) {
      addToast('Failed to mark scheduled appointment as missed.', 'error');
    } finally {
      setModalLoading(false);
      setSelectedRecordId(null);
    }
  };

  // Cancel record
  const handleCancelRecord = async () => {
    if (!selectedRecordId) return;
    setModalLoading(true);
    try {
      await serviceRecordService.cancelServiceRecord(selectedRecordId);
      addToast('Service record cancelled successfully.', 'success');
      setIsCancelRecordOpen(false);
      fetchHistoryRecords();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to cancel service record.', 'error');
    } finally {
      setModalLoading(false);
      setSelectedRecordId(null);
    }
  };

  // Expand row detail helpers
  const toggleHistoryRow = (id) => {
    setExpandedHistoryRow(expandedHistoryRow === id ? null : id);
  };

  const getStatusBadge = (status) => {
    const base = 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase';
    switch (status) {
      case 'scheduled':
        return <span className={`${base} bg-blue-50 border-blue-200 text-blue-500`}>Scheduled</span>;
      case 'in_progress':
        return <span className={`${base} bg-purple-50 border-purple-200 text-purple-600 animate-pulse`}>In Progress</span>;
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

  const getInvoiceBadge = (status) => {
    const base = 'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border';
    switch (status) {
      case 'draft':
        return <span className={`${base} bg-amber-50 border-amber-200 text-amber-600`}>Draft</span>;
      case 'sent':
        return <span className={`${base} bg-sky-50 border-sky-200 text-sky-600`}>Sent</span>;
      case 'partially_paid':
        return <span className={`${base} bg-orange-50 border-orange-200 text-orange-500`}>Part Paid</span>;
      case 'paid':
        return <span className={`${base} bg-emerald-50 border-emerald-200 text-emerald-600`}>Paid</span>;
      case 'overdue':
        return <span className={`${base} bg-red-50 border-red-200 text-red-600`}>Overdue</span>;
      default:
        return <span className={`${base} bg-slate-50 border-slate-200 text-slate-500`}>{status}</span>;
    }
  };

  const handleOpenPhotoLightbox = (photos, idx) => {
    setLightboxPhotos(photos);
    setLightboxIndex(idx);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-accent border-r-2" />
      </div>
    );
  }

  if (!service) return null;

  const ownerName = service.CustomerID
    ? `${service.CustomerFirstName} ${service.CustomerSureName}`
    : service.AgencyName;

  const propertyTypeDisplay = service.PropertyType
    ? service.PropertyType.charAt(0).toUpperCase() + service.PropertyType.slice(1)
    : 'Other';

  return (
    <div className="space-y-6 text-left">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2">
        <Link
          to="/services"
          className="inline-flex items-center text-xs font-bold text-slate-400 hover:text-slate-650 uppercase tracking-wider transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-0.5" />
          Back to list
        </Link>
      </div>

      {/* Header Info */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between gap-6">
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase border bg-blue-50 text-blue-600 border-blue-200/50">
                {service.Type === 'one_off' ? 'One-Off' : 'Regular'}
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase border bg-slate-100 text-slate-600 border-slate-200">
                {propertyTypeDisplay}
              </span>
              <span className="text-xs text-slate-400 font-bold tracking-wide">
                Ref No: {service.RefNo || 'N/A'}
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight mt-2">
              {service.AddressLine}
            </h1>
            <p className="text-slate-500 text-sm font-semibold">
              {service.City}, {service.PostCode}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-6 text-xs text-slate-600 font-medium pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              <span>Owner: <strong className="text-slate-800">{ownerName}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>
                Schedule: <strong className="text-slate-800">
                  {service.Type === 'one_off' 
                    ? 'One-Off Job' 
                    : `${service.scheduleRule?.Frequency} · ${service.scheduleRule?.DayOfWeek || (service.scheduleRule?.DayOfMonth ? `Day ${service.scheduleRule?.DayOfMonth}` : '')}`}
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-teal-600" />
              <span>
                Rate: <strong className="text-slate-800">{formatGBP(service.EffectiveRate)}/hr</strong>
                <span className="text-[10px] text-slate-400 font-bold bg-slate-100 border border-slate-200 rounded px-1 ml-1.5 uppercase">
                  {service.EffectiveRateSource}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span>Beds: <strong className="text-slate-800">{service.Beds || 0}</strong></span>
              <span>•</span>
              <span>Baths: <strong className="text-slate-800">{service.Bathrooms || 0}</strong></span>
              <span>•</span>
              <span>Kitchens: <strong className="text-slate-800">{service.Kitchens || 0}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-slate-400" />
              <span>Pets: <strong className="text-slate-800">{service.HasPet ? 'Yes' : 'No'}</strong></span>
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div className="flex flex-col justify-between items-start md:items-end border-l border-dashed border-slate-100 pl-0 md:pl-6 gap-4 self-stretch min-w-[200px]">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Service Status</span>
            {getStatusBadge(service.Status)}
          </div>

          {isAdminOrManager && (
            <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl w-full">
              <label className="flex items-center justify-between gap-4 cursor-pointer text-xs font-bold text-slate-700">
                <div className="space-y-0.5">
                  <span>Photo Requirement</span>
                  <span className="text-[9px] text-slate-400 font-medium block">Require check-out photo</span>
                </div>
                <input
                  type="checkbox"
                  checked={service.RequireCheckoutPhoto === 1}
                  onChange={handleTogglePhotoRequirement}
                  className="w-4 h-4 text-brand-accent rounded border-slate-350 focus:ring-brand-accent cursor-pointer"
                />
              </label>
            </div>
          )}
        </div>
      </div>

      {service.Note && (
        <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 text-xs font-medium text-slate-650 italic">
          <strong>Service Notes:</strong> "{service.Note}"
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-6" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`py-3.5 px-1 border-b-2 font-bold text-sm transition-all ${
              activeTab === 'upcoming'
                ? 'border-brand-accent text-brand-primary'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Upcoming Schedule
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3.5 px-1 border-b-2 font-bold text-sm transition-all ${
              activeTab === 'history'
                ? 'border-brand-accent text-brand-primary'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Service History
          </button>
        </nav>
      </div>

      {/* Tab Contents */}
      {activeTab === 'upcoming' ? (
        <div className="space-y-6">
          {/* Rule Cleaners Assignments Section */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Assigned Cleaners</h3>
                <p className="text-xs text-slate-500">Assign employees to handle this recurring schedule rule.</p>
              </div>

              {/* Assign Cleaner Action */}
              {isAdminOrManager && (
                <div className="relative">
                  <Button
                    onClick={() => setIsAssignDropdownOpen(!isAssignDropdownOpen)}
                    variant="outline"
                    className="font-bold flex items-center gap-1.5 text-xs py-1.5 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Assign Cleaner</span>
                  </Button>

                  {isAssignDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 max-h-60 bg-white border border-slate-200 rounded-xl shadow-lg overflow-y-auto z-30">
                      <div className="px-3 py-2 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100">
                        Available Cleaners
                      </div>
                      <div className="divide-y divide-slate-100">
                        {cleanersList.length === 0 ? (
                          <div className="p-3 text-xs text-slate-400 italic">No available active cleaners.</div>
                        ) : (
                          cleanersList.map((emp) => (
                            <button
                              key={emp.EmployeeID}
                              onClick={() => handleAssignCleaner(emp.EmployeeID)}
                              className="w-full text-left px-3 py-2 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center justify-between"
                            >
                              <span>{emp.FirstName} {emp.SureName} ({emp.Role.replace('_', ' ')})</span>
                              {scheduleCleaners.map(c => c.EmployeeID).includes(emp.EmployeeID) && (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Current Cleaner Initials Badges */}
            <div className="flex flex-wrap gap-3 pt-1">
              {scheduleCleaners.length === 0 ? (
                <div className="text-xs text-slate-400 font-semibold italic">No cleaners currently assigned.</div>
              ) : (
                scheduleCleaners.map((cleaner) => {
                  const initials = `${cleaner.FirstName.charAt(0)}${cleaner.SureName.charAt(0)}`.toUpperCase();
                  return (
                    <div
                      key={cleaner.EmployeeID}
                      className="flex items-center gap-2 bg-brand-primary/5 border border-brand-accent/30 text-brand-primary rounded-xl px-3 py-1.5 text-xs font-bold shadow-xs hover:border-brand-accent transition-colors"
                      title={`${cleaner.FirstName} ${cleaner.SureName}`}
                    >
                      <div className="w-6 h-6 bg-brand-accent text-white flex items-center justify-center rounded-full text-[10px] font-black">
                        {initials}
                      </div>
                      <span>{cleaner.FirstName} {cleaner.SureName}</span>
                      {isAdminOrManager && (
                        <button
                          onClick={() => handleRemoveCleaner(cleaner.EmployeeID)}
                          className="p-0.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded"
                          title="Remove assignment"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Upcoming Schedule List */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Upcoming occurrences</h3>

            {/* Schedule Filters */}
            <div className="flex gap-4 flex-wrap items-end bg-slate-50/50 p-4 border border-slate-150 rounded-2xl">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Start Date</span>
                <input
                  type="date"
                  value={scheduleFilters.startDate}
                  onChange={(e) => setScheduleFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700"
                />
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">End Date</span>
                <input
                  type="date"
                  value={scheduleFilters.endDate}
                  onChange={(e) => setScheduleFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700"
                />
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</span>
                <select
                  value={scheduleFilters.status}
                  onChange={(e) => setScheduleFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700"
                >
                  <option>All</option>
                  <option>Scheduled</option>
                  <option>Missed</option>
                  <option>Cancelled</option>
                  <option>Skipped</option>
                  <option>Completed</option>
                </select>
              </div>

              <Button
                onClick={() => setScheduleFilters({ startDate: '', endDate: '', status: 'All' })}
                variant="outline"
                className="text-[10px] font-bold uppercase py-1 border-slate-200 hover:bg-slate-100"
              >
                Reset
              </Button>
            </div>

            {/* Schedule Table */}
            {upcomingLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-brand-accent" />
              </div>
            ) : upcomingSchedule.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 italic">No scheduled occurrences match the criteria.</div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-250 font-bold">
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Day</th>
                      <th className="px-4 py-3">Start Time</th>
                      <th className="px-4 py-3">Est. Hours</th>
                      <th className="px-4 py-3">Cleaners</th>
                      <th className="px-4 py-3">Status</th>
                      {isAdminOrManager && <th className="px-4 py-3 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {upcomingSchedule.map((row) => {
                      const dayName = new Date(row.ScheduledDate).toLocaleDateString('en-GB', { weekday: 'short' });
                      const isPast = new Date(row.ScheduledDate).getTime() < new Date().setHours(0,0,0,0);

                      return (
                        <tr key={row.ServiceRecordID} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 font-bold text-slate-800">{formatDate(row.ScheduledDate)}</td>
                          <td className="px-4 py-3 text-slate-500">{dayName}</td>
                          <td className="px-4 py-3 text-slate-650">{formatTime(row.ScheduledStart)}</td>
                          <td className="px-4 py-3 font-bold text-slate-700">{parseFloat(row.EstimatedHours).toFixed(1)} hrs</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              {scheduleCleaners.length === 0 ? (
                                <span className="text-[10px] text-slate-400 font-bold bg-slate-100 border border-slate-200 rounded px-1.5">Unassigned</span>
                              ) : (
                                scheduleCleaners.map(c => {
                                  const initials = `${c.FirstName.charAt(0)}${c.SureName.charAt(0)}`.toUpperCase();
                                  return (
                                    <div
                                      key={c.EmployeeID}
                                      className="w-5 h-5 bg-brand-primary/10 text-brand-primary flex items-center justify-center rounded-full text-[9px] font-bold border border-brand-accent/20 cursor-help"
                                      title={`${c.FirstName} ${c.SureName}`}
                                    >
                                      {initials}
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">{getStatusBadge(row.Status)}</td>
                          {isAdminOrManager && (
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {row.Status === 'scheduled' && (
                                  <>
                                    {isPast && (
                                      <button
                                        onClick={() => {
                                          setSelectedRecordId(row.ServiceRecordID);
                                          setIsMarkMissedOpen(true);
                                        }}
                                        className="px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded font-bold uppercase text-[9px]"
                                      >
                                        Missed
                                      </button>
                                    )}
                                    <button
                                      onClick={() => {
                                        setSelectedRecordId(row.ServiceRecordID);
                                        setIsCancelRowOpen(true);
                                      }}
                                      className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded"
                                      title="Cancel appointment"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Execution History</h3>

          {historyLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-brand-accent" />
            </div>
          ) : historyRecords.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 italic">No historical records found for this service.</div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-250 font-bold">
                      <th className="px-4 py-3 w-8"></th>
                      <th className="px-4 py-3">Scheduled Date</th>
                      <th className="px-4 py-3">Assigned Cleaners</th>
                      <th className="px-4 py-3">Check-in Time</th>
                      <th className="px-4 py-3">Check-out Time</th>
                      <th className="px-4 py-3">Actual Hours</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Invoice</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {historyRecords.map((row) => {
                      const isExpanded = expandedHistoryRow === row.ServiceRecordID;
                      
                      // Calculate earliest check-in and latest check-out
                      const checkIns = row.cleaners?.map(c => c.CheckIn).filter(Boolean);
                      const checkOuts = row.cleaners?.map(c => c.CheckOut).filter(Boolean);
                      
                      const earliestCheckIn = checkIns?.length > 0
                        ? formatTime(new Date(Math.min(...checkIns.map(d => new Date(d).getTime()))).toISOString().substring(11, 19))
                        : '—';
                      const latestCheckOut = checkOuts?.length > 0 && checkOuts.length === row.cleaners.length
                        ? formatTime(new Date(Math.max(...checkOuts.map(d => new Date(d).getTime()))).toISOString().substring(11, 19))
                        : '—';

                      return (
                        <React.Fragment key={row.ServiceRecordID}>
                          <tr 
                            className={`transition-colors cursor-pointer ${isExpanded ? 'bg-slate-50/25' : 'hover:bg-slate-50/30'}`}
                            onClick={() => toggleHistoryRow(row.ServiceRecordID)}
                          >
                            <td className="px-4 py-3 text-center">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-slate-600 mx-auto" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-slate-400 -rotate-90 mx-auto" />
                              )}
                            </td>
                            <td className="px-4 py-3 font-bold text-slate-800">{formatDate(row.ScheduledDate)}</td>
                            <td className="px-4 py-3">
                              <span className="text-slate-700">
                                {row.cleaners?.map(c => `${c.FirstName} ${c.SureName}`).join(', ') || 'No cleaner checked in'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-600">{earliestCheckIn}</td>
                            <td className="px-4 py-3 text-slate-600">{latestCheckOut}</td>
                            <td className="px-4 py-3 font-bold text-slate-700">{row.ActualHours ? `${parseFloat(row.ActualHours).toFixed(1)} hrs` : '—'}</td>
                            <td className="px-4 py-3">{getStatusBadge(row.Status)}</td>
                            <td className="px-4 py-3">
                              {row.InvoiceNumber ? (
                                <Link 
                                  to={`/invoices/${row.ServiceRecordID}`} 
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex items-center gap-1 text-teal-650 hover:underline font-bold"
                                >
                                  {row.InvoiceNumber}
                                  {getInvoiceBadge(row.InvoiceStatus)}
                                </Link>
                              ) : '—'}
                            </td>
                            <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-2">
                                <Link
                                  to={`/service-records/${row.ServiceRecordID}`}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-250 text-slate-650 rounded font-bold uppercase text-[9px] inline-flex items-center gap-0.5"
                                >
                                  Details
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </Link>
                                {isAdminOrManager && ['in_progress', 'completed'].includes(row.Status) && row.InvoiceStatus !== 'sent' && row.InvoiceStatus !== 'paid' && (
                                  <button
                                    onClick={() => {
                                      setSelectedRecordId(row.ServiceRecordID);
                                      setIsCancelRecordOpen(true);
                                    }}
                                    className="px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded font-bold uppercase text-[9px]"
                                  >
                                    Cancel
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>

                          {/* Expandable row layout */}
                          {isExpanded && (
                            <tr>
                              <td colSpan="9" className="px-8 py-4 bg-slate-50/20 border-t border-b border-slate-150">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                                  {/* Cleaners GPS Log */}
                                  <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cleaner Tracking & Timesheets</h4>
                                    <div className="divide-y divide-slate-150 border border-slate-200 rounded-xl bg-white p-3 space-y-2">
                                      {row.cleaners && row.cleaners.length > 0 ? (
                                        row.cleaners.map((cleaner) => (
                                          <div key={cleaner.ServiceRecordCleanerID} className="py-2 first:pt-0 last:pb-0 text-xs">
                                            <div className="flex justify-between items-center">
                                              <span className="font-bold text-slate-800">{cleaner.FirstName} {cleaner.SureName}</span>
                                              <span className="font-medium text-slate-400">Worked: {cleaner.ActualHours || '0.0'} hrs</span>
                                            </div>
                                            <div className="flex gap-4 text-slate-500 font-medium mt-1">
                                              <span>In: {cleaner.CheckIn ? formatTime(cleaner.CheckIn.substring(11, 19)) : '—'}</span>
                                              <span>Out: {cleaner.CheckOut ? formatTime(cleaner.CheckOut.substring(11, 19)) : '—'}</span>
                                            </div>
                                            <div className="flex gap-3 text-brand-primary text-[10px] font-bold mt-1.5">
                                              {cleaner.CheckInLat && (
                                                <a 
                                                  href={`https://maps.google.com/?q=${cleaner.CheckInLat},${cleaner.CheckInLng}`}
                                                  target="_blank"
                                                  rel="noreferrer"
                                                  className="hover:underline inline-flex items-center gap-0.5"
                                                >
                                                  📍 Check-in GPS
                                                </a>
                                              )}
                                              {cleaner.CheckOutLat && (
                                                <a 
                                                  href={`https://maps.google.com/?q=${cleaner.CheckOutLat},${cleaner.CheckOutLng}`}
                                                  target="_blank"
                                                  rel="noreferrer"
                                                  className="hover:underline inline-flex items-center gap-0.5"
                                                >
                                                  📍 Check-out GPS
                                                </a>
                                              )}
                                            </div>
                                            {cleaner.Note && (
                                              <div className="mt-2 p-2 bg-slate-50 rounded-lg text-slate-600 font-medium italic border border-slate-100">
                                                Note: "{cleaner.Note}"
                                              </div>
                                            )}
                                          </div>
                                        ))
                                      ) : (
                                        <div className="text-slate-400 italic">No check-in logs recorded.</div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Photos Section */}
                                  <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Uploaded Photos</h4>
                                    {row.photos && row.photos.length > 0 ? (
                                      <div className="grid grid-cols-3 gap-2">
                                        {row.photos.map((photo, pIdx) => {
                                          const url = `${import.meta.env.VITE_API_URL || ''}/${photo.DriveURL}`;
                                          return (
                                            <div 
                                              key={photo.ServicePhotoID} 
                                              className="relative aspect-square rounded-xl border border-slate-200 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                                              onClick={() => handleOpenPhotoLightbox(row.photos, pIdx)}
                                            >
                                              <img 
                                                src={url} 
                                                alt="Clean checklist preview" 
                                                className="w-full h-full object-cover"
                                              />
                                              <span className="absolute bottom-1 right-1 px-1 bg-black/60 text-white rounded text-[8px] font-black uppercase">
                                                {photo.PhotoType}
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <div className="border border-slate-200 border-dashed rounded-xl bg-white/50 p-6 text-center text-slate-450 flex flex-col items-center justify-center">
                                        <Camera className="w-6 h-6 text-slate-300 mb-1" />
                                        <span className="text-xs font-semibold">No checkout photos uploaded</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {historyTotalPages > 1 && (
                <Pagination
                  page={historyPage}
                  totalPages={historyTotalPages}
                  limit={10}
                  total={historyTotal}
                  onPageChange={(p) => setHistoryPage(p)}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* Cancel Schedule Row Confirmation Modal */}
      <Modal
        isOpen={isCancelRowOpen}
        onClose={() => setIsCancelRowOpen(false)}
        title="Cancel Scheduled Appointment"
        onConfirm={handleCancelRow}
        confirmText="Cancel Occurrence"
        confirmVariant="danger"
        isLoading={modalLoading}
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 p-3 rounded-xl">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span className="text-xs font-semibold">Cancel Appointment</span>
          </div>
          <p className="text-sm text-slate-650 leading-relaxed">
            Are you sure you want to cancel this scheduled cleaning slot? Cleaners will not be able to check in to this appointment.
          </p>
        </div>
      </Modal>

      {/* Mark Schedule Row as Missed Modal */}
      <Modal
        isOpen={isMarkMissedOpen}
        onClose={() => setIsMarkMissedOpen(false)}
        title="Mark Appointment as Missed"
        onConfirm={handleMarkMissed}
        confirmText="Mark as Missed"
        confirmVariant="warning"
        isLoading={modalLoading}
      >
        <div className="space-y-2">
          <p className="text-sm text-slate-650 leading-relaxed">
            Are you sure you want to mark this past scheduled cleaning slot as <strong>missed</strong>? This signals that no cleaners checked in or performed the cleaning.
          </p>
        </div>
      </Modal>

      {/* Cancel Service Record Modal */}
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
            <span className="text-xs font-semibold">Warning: This will also cancel any associated draft invoices.</span>
          </div>
          <p className="text-sm text-slate-650 leading-relaxed">
            Are you sure you want to cancel this service record? This action cannot be undone.
          </p>
        </div>
      </Modal>

      {/* Lightbox Overlay */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col justify-between items-center p-4">
          {/* Top panel */}
          <div className="w-full flex justify-between items-center text-white py-2">
            <span className="text-xs font-bold font-mono">
              Photo {lightboxIndex + 1} of {lightboxPhotos.length} ({lightboxPhotos[lightboxIndex].PhotoType.toUpperCase()})
            </span>
            <button
              onClick={() => setLightboxIndex(null)}
              className="p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Image slide */}
          <div className="flex-1 flex justify-center items-center w-full max-h-[80vh]">
            <img
              src={`${import.meta.env.VITE_API_URL || ''}/${lightboxPhotos[lightboxIndex].DriveURL}`}
              alt="Clean checklist full preview"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>

          {/* Navigation panel */}
          <div className="w-full flex justify-center gap-4 py-4">
            <Button
              disabled={lightboxIndex === 0}
              onClick={() => setLightboxIndex(prev => prev - 1)}
              variant="outline"
              className="text-white border-white/25 hover:bg-white/10"
            >
              Previous
            </Button>
            <Button
              disabled={lightboxIndex === lightboxPhotos.length - 1}
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

export default ServiceDetailPage;
