import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { serviceRecordService } from '../../serviceRecords/services/serviceRecordService';
import { employeeService } from '../../employees/services/employeeService';
import { useToast } from '../../../hooks/useToast';
import useAuth from '../../../hooks/useAuth';
import { ROLES } from '../../../utils/constants';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import Modal from '../../../components/common/Modal';
import Pagination from '../../../components/common/Pagination';
import { formatDate, formatTime } from '../../../utils/formatters';
import {
  Plus,
  Trash2,
  X,
  Check,
  ExternalLink,
  Calendar,
  MapPin,
  User,
  Clock,
  ChevronRight,
  UserCheck,
  Search,
  Filter
} from 'lucide-react';

export const SchedulePage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { role } = useAuth();

  const isAdminOrManager = role === ROLES.ADMIN || role === ROLES.MANAGER;

  // Global schedule listings state
  const [scheduleRows, setScheduleRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);

  // Cleaners cache: { [ServiceScheduleID]: cleanersArray }
  const [cleanersCache, setCleanersCache] = useState({});
  const [cleanersList, setCleanersList] = useState([]); // All active cleaners list for dropdowns

  // Filters State
  const todayStr = new Date().toISOString().substring(0, 10);
  const defaultToDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().substring(0, 10);
  };

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    from: todayStr,
    to: defaultToDate(),
    status: '',
    customerId: '',
    agencyId: ''
  });

  // Action / Dropdowns State
  const [activeAssignRow, setActiveAssignRow] = useState(null); // { scheduleId, serviceScheduleId }
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isMarkMissedOpen, setIsMarkMissedOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  // Fetch Schedules
  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const result = await serviceRecordService.getGlobalSchedule({
        page,
        limit,
        from: filters.from || undefined,
        to: filters.to || undefined,
        status: filters.status || undefined,
        search: search || undefined
      });
      setScheduleRows(result.data || []);
      setTotal(result.pagination?.total || 0);
      setTotalPages(result.pagination?.totalPages || 0);
    } catch (err) {
      addToast('Failed to load global schedule list.', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, limit, filters, search, addToast]);

  // Fetch Active Cleaners list
  const fetchActiveCleaners = useCallback(async () => {
    if (!isAdminOrManager) return;
    try {
      const result = await employeeService.getEmployees({ isActive: true, limit: 1000 });
      const filtered = (result.data || []).filter(e => 
        ['cleaner', 'cleaner_manager', 'manager', 'admin'].includes(e.Role)
      );
      setCleanersList(filtered);
    } catch (err) {
      console.error('Failed to load cleaners for assign:', err.message);
    }
  }, [isAdminOrManager]);

  // Cache loading for cleaners
  useEffect(() => {
    const fetchCleanersForVisibleSchedules = async () => {
      const uniqueScheduleIds = [...new Set(scheduleRows.map(r => r.ServiceScheduleID).filter(Boolean))];
      const toFetch = uniqueScheduleIds.filter(id => !cleanersCache[id]);
      if (toFetch.length === 0) return;

      try {
        const results = await Promise.all(
          toFetch.map(async (id) => {
            const res = await serviceRecordService.getScheduleCleaners(id);
            return { id, cleaners: res.data || [] };
          })
        );
        setCleanersCache(prev => {
          const updated = { ...prev };
          results.forEach(({ id, cleaners }) => {
            updated[id] = cleaners;
          });
          return updated;
        });
      } catch (err) {
        console.error('Failed to load cleaners cache:', err.message);
      }
    };

    if (scheduleRows.length > 0) {
      fetchCleanersForVisibleSchedules();
    }
  }, [scheduleRows, cleanersCache]);

  useEffect(() => {
    fetchSchedules();
    fetchActiveCleaners();
  }, [fetchSchedules, fetchActiveCleaners]);

  // Cleaners assignment triggers
  const handleAssignCleaner = async (serviceScheduleId, employeeId) => {
    try {
      const currentCleaners = cleanersCache[serviceScheduleId] || [];
      const currentIds = currentCleaners.map(c => c.EmployeeID);
      if (currentIds.includes(employeeId)) {
        addToast('Cleaner is already assigned to this schedule.', 'warning');
        return;
      }
      const newIds = [...currentIds, employeeId];
      await serviceRecordService.assignCleanersToSchedule(serviceScheduleId, newIds);
      addToast('Cleaner assigned successfully.', 'success');
      setActiveAssignRow(null);

      // Force reload cleaners cache for this ID
      const res = await serviceRecordService.getScheduleCleaners(serviceScheduleId);
      setCleanersCache(prev => ({ ...prev, [serviceScheduleId]: res.data || [] }));
    } catch (err) {
      addToast('Failed to assign cleaner to schedule rule.', 'error');
    }
  };

  const handleRemoveCleaner = async (serviceScheduleId, employeeId) => {
    if (!window.confirm('Are you sure you want to remove this cleaner from the schedule?')) return;
    try {
      await serviceRecordService.removeCleanerFromSchedule(serviceScheduleId, employeeId);
      addToast('Cleaner removed successfully.', 'success');

      // Update cache
      setCleanersCache(prev => ({
        ...prev,
        [serviceScheduleId]: (prev[serviceScheduleId] || []).filter(c => c.EmployeeID !== employeeId)
      }));
    } catch (err) {
      addToast('Failed to remove cleaner.', 'error');
    }
  };

  // Status updates
  const handleCancelRow = async () => {
    if (!selectedRecordId) return;
    setModalLoading(true);
    try {
      await serviceRecordService.updateScheduleStatus(selectedRecordId, 'cancelled');
      addToast('Appointment cancelled successfully.', 'success');
      setIsCancelOpen(false);
      fetchSchedules();
    } catch (err) {
      addToast('Failed to cancel appointment.', 'error');
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
      addToast('Appointment marked as missed.', 'success');
      setIsMarkMissedOpen(false);
      fetchSchedules();
    } catch (err) {
      addToast('Failed to update status to missed.', 'error');
    } finally {
      setModalLoading(false);
      setSelectedRecordId(null);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setFilters({
      from: todayStr,
      to: defaultToDate(),
      status: '',
      customerId: '',
      agencyId: ''
    });
    setPage(1);
  };

  const getStatusBadge = (status) => {
    const base = 'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase';
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

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Schedules Management</h1>
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mt-1">
          Assign cleaners, monitor check-in progress, and update job status
        </p>
      </div>

      {/* Filter panel */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-slate-700 pb-1.5 border-b border-slate-100">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Filter Occurrences</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
          {/* Search */}
          <div className="flex flex-col gap-1 md:col-span-2">
            <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Search contract</span>
            <div className="relative">
              <input
                type="text"
                placeholder="Search address, Customer, or Agency name..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full bg-white border border-slate-205 rounded-xl pl-9 pr-4 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs focus:outline-none focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-colors"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Date from */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">From Date</span>
            <input
              type="date"
              value={filters.from}
              onChange={(e) => handleFilterChange('from', e.target.value)}
              className="w-full bg-white border border-slate-205 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs focus:outline-none focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-colors"
            />
          </div>

          {/* Date to */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">To Date</span>
            <input
              type="date"
              value={filters.to}
              onChange={(e) => handleFilterChange('to', e.target.value)}
              className="w-full bg-white border border-slate-205 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs focus:outline-none focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-colors"
            />
          </div>

          {/* Status filter */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Occurrence Status</span>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full bg-white border border-slate-205 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs focus:outline-none focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-colors"
            >
              <option value="">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="missed">Missed</option>
              <option value="cancelled">Cancelled</option>
              <option value="skipped">Skipped</option>
            </select>
          </div>

          <div className="flex items-center">
            <Button
              onClick={handleResetFilters}
              variant="outline"
              className="text-xs font-bold uppercase tracking-wider py-1.5 border-slate-250 hover:bg-slate-50 w-full"
            >
              Reset Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Main List Table */}
      {loading ? (
        <div className="flex justify-center py-16 bg-white border border-slate-200 rounded-3xl animate-pulse">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-accent border-r-2" />
        </div>
      ) : scheduleRows.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center text-slate-400 font-semibold shadow-xs">
          No scheduled appointments found for the selected criteria.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full min-w-[1100px] text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3.5">Ref No</th>
                  <th className="px-5 py-3.5">Customer / Agency</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5">Time</th>
                  <th className="px-4 py-3.5">Est. Hrs</th>
                  <th className="px-5 py-3.5">Address</th>
                  <th className="px-6 py-3.5">Assigned Cleaners</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {scheduleRows.map((row) => {
                  const owner = row.CustomerID 
                    ? `${row.CustomerFirstName} ${row.CustomerSureName}`
                    : row.AgencyName;
                  const dayName = new Date(row.ScheduledDate).toLocaleDateString('en-GB', { weekday: 'short' });
                  const isPast = new Date(row.ScheduledDate).getTime() < new Date().setHours(0,0,0,0);
                  const rowCleaners = cleanersCache[row.ServiceScheduleID] || [];

                  return (
                    <tr key={row.ServiceRecordID} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-slate-800">{row.RefNo || '—'}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700">{owner}</span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                            {row.CustomerID ? 'Customer' : 'Agency'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-700">{formatDate(row.ScheduledDate)} ({dayName})</td>
                      <td className="px-4 py-3.5 text-slate-650">{formatTime(row.ScheduledStart)}</td>
                      <td className="px-4 py-3.5 font-bold text-slate-700">{parseFloat(row.EstimatedHours).toFixed(1)} hrs</td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col text-slate-650">
                          <span>{row.ServiceAddressLine}</span>
                          <span className="text-slate-400">{row.ServiceCity}, {row.ServicePostCode}</span>
                        </div>
                      </td>
                      
                      {/* Cleaners assignments column */}
                      <td className="px-6 py-3.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {rowCleaners.map((cleaner) => {
                            const initials = `${cleaner.FirstName.charAt(0)}${cleaner.SureName.charAt(0)}`.toUpperCase();
                            return (
                              <div
                                key={cleaner.EmployeeID}
                                className="inline-flex items-center gap-1 bg-brand-primary/5 text-brand-primary border border-brand-accent/20 px-2 py-0.5 rounded text-[9px] font-black"
                                title={`${cleaner.FirstName} ${cleaner.SureName}`}
                              >
                                <span>{initials}</span>
                                {isAdminOrManager && (
                                  <button
                                    onClick={() => handleRemoveCleaner(row.ServiceScheduleID, cleaner.EmployeeID)}
                                    className="text-slate-400 hover:text-red-650 rounded-sm"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            );
                          })}

                          {/* Assign button */}
                          {isAdminOrManager && row.ServiceScheduleID && (
                            <div className="relative">
                              <button
                                onClick={() => setActiveAssignRow(
                                  activeAssignRow?.ServiceRecordID === row.ServiceRecordID 
                                    ? null 
                                    : { ServiceRecordID: row.ServiceRecordID, ServiceScheduleID: row.ServiceScheduleID }
                                )}
                                className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 border border-slate-250 text-slate-550 rounded text-[9px] font-bold"
                              >
                                + Assign
                              </button>

                              {activeAssignRow?.ServiceRecordID === row.ServiceRecordID && (
                                <div className="absolute left-0 mt-2 w-52 max-h-48 bg-white border border-slate-200 rounded-xl shadow-lg overflow-y-auto z-20">
                                  <div className="px-2 py-1 bg-slate-50 border-b border-slate-100 text-[9px] font-bold text-slate-450 uppercase">
                                    Assign Cleaner
                                  </div>
                                  <div className="divide-y divide-slate-100">
                                    {cleanersList.length === 0 ? (
                                      <div className="p-2 text-[10px] text-slate-400 italic">No cleaners.</div>
                                    ) : (
                                      cleanersList.map((emp) => (
                                        <button
                                          key={emp.EmployeeID}
                                          onClick={() => handleAssignCleaner(row.ServiceScheduleID, emp.EmployeeID)}
                                          className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-[10px] font-semibold text-slate-700 flex justify-between items-center"
                                        >
                                          <span>{emp.FirstName} {emp.SureName}</span>
                                          {rowCleaners.map(c => c.EmployeeID).includes(emp.EmployeeID) && (
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
                      </td>

                      <td className="px-4 py-3.5">{getStatusBadge(row.Status)}</td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          {/* View details */}
                          {row.Status === 'scheduled' ? (
                            <Link
                              to={`/services/${row.ServiceID}`}
                              className="p-1 hover:bg-slate-100 rounded text-slate-450 hover:text-slate-800"
                              title="View service detail"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </Link>
                          ) : (
                            <Link
                              to={`/service-records/${row.ServiceRecordID}`}
                              className="p-1 hover:bg-slate-100 rounded text-slate-450 hover:text-slate-800"
                              title="View check-in log details"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </Link>
                          )}

                          {/* Action drop menu */}
                          {isAdminOrManager && row.Status === 'scheduled' && (
                            <div className="flex gap-1">
                              {isPast && (
                                <button
                                  onClick={() => {
                                    setSelectedRecordId(row.ServiceRecordID);
                                    setIsMarkMissedOpen(true);
                                  }}
                                  className="px-1.5 py-0.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded font-bold uppercase text-[9px]"
                                >
                                  Missed
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setSelectedRecordId(row.ServiceRecordID);
                                  setIsCancelOpen(true);
                                }}
                                className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-650 rounded-lg"
                                title="Cancel appointment"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              limit={limit}
              total={total}
              onPageChange={(p) => setPage(p)}
            />
          )}
        </div>
      )}

      {/* Cancel scheduled slot modal */}
      <Modal
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        title="Cancel Scheduled Occurrence"
        onConfirm={handleCancelRow}
        confirmText="Cancel occurrence"
        confirmVariant="danger"
        isLoading={modalLoading}
      >
        <p className="text-slate-650">
          Are you sure you want to cancel this scheduled cleaning slot? Cleaners will not be able to check in to this appointment.
        </p>
      </Modal>

      {/* Mark missed modal */}
      <Modal
        isOpen={isMarkMissedOpen}
        onClose={() => setIsMarkMissedOpen(false)}
        title="Mark Occurrence as Missed"
        onConfirm={handleMarkMissed}
        confirmText="Mark as missed"
        confirmVariant="warning"
        isLoading={modalLoading}
      >
        <p className="text-slate-650">
          Are you sure you want to mark this past scheduled cleaning slot as <strong>missed</strong>? This signals that no cleaners checked in or performed the cleaning on time.
        </p>
      </Modal>
    </div>
  );
};

export default SchedulePage;
