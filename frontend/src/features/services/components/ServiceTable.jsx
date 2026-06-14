import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from '../../../components/common/Badge';
import ServiceScheduleSubTable from './ServiceScheduleSubTable';
import { serviceService } from '../services/serviceService';
import { Edit2, Trash2, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';
import { formatDate, formatTime } from '../../../utils/formatters';

export const ServiceTable = ({
  services = [],
  isLoading = false,
  onEdit,
  onDelete,
  onOpenPauseModal
}) => {
  const navigate = useNavigate();
  const [expandedRows, setExpandedRows] = useState({});
  const [schedules, setSchedules] = useState({});
  const [loadingSchedule, setLoadingSchedule] = useState({});

  const toggleRow = async (serviceId) => {
    const isExpanded = !!expandedRows[serviceId];
    setExpandedRows((prev) => ({ ...prev, [serviceId]: !isExpanded }));

    // Load schedule if expanding and not already loaded
    if (!isExpanded && !schedules[serviceId]) {
      setLoadingSchedule((prev) => ({ ...prev, [serviceId]: true }));
      try {
        const result = await serviceService.getServiceSchedule(serviceId);
        setSchedules((prev) => ({ ...prev, [serviceId]: result.data || [] }));
      } catch (err) {
        console.error(`Failed to load schedule for service ${serviceId}:`, err.message);
      } finally {
        setLoadingSchedule((prev) => ({ ...prev, [serviceId]: false }));
      }
    }
  };

  const getStatusBadge = (row) => {
    const base = "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border";
    if (row.IsActive === 0 || row.IsActive === false) {
      return (
        <span className={`${base} bg-slate-500/10 border-slate-500/20 text-slate-400`}>
          <span className="w-1 h-1 rounded-full bg-slate-400" />
          Inactive
        </span>
      );
    }

    if (row.Status === 'pause_requested') {
      return (
        <span className={`${base} bg-orange-500/10 border-orange-500/20 text-orange-500 animate-pulse`}>
          <AlertTriangle className="w-3 h-3" />
          Pause Requested
        </span>
      );
    }

    if (row.Status === 'paused') {
      return (
        <span className={`${base} bg-amber-500/10 border-amber-500/20 text-amber-500`}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-550" />
          Paused
        </span>
      );
    }

    // Default Active
    return (
      <span className={`${base} bg-emerald-500/10 border-emerald-500/20 text-emerald-500`}>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Active
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const base = "px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase border";
    if (type === 'one_off') {
      return <span className={`${base} bg-slate-100 text-slate-600 border-slate-200`}>One-Off</span>;
    }
    return <span className={`${base} bg-blue-50 text-blue-600 border-blue-200/50`}>Regular</span>;
  };

  const formatScheduleRule = (row) => {
    if (row.Type === 'one_off') {
      // In database rule for one_off, schedule records are returned in detail, let's display RegisterDate or date info
      return row.StartDate ? `Date: ${formatDate(row.StartDate)}` : 'One-Off Schedule';
    }
    
    // For Regular: e.g. "Weekly · Mon · 09:00"
    const freq = row.Frequency ? row.Frequency.charAt(0).toUpperCase() + row.Frequency.slice(1) : '';
    const detail = row.DayOfWeek || (row.DayOfMonth ? `Day ${row.DayOfMonth}` : '');
    const time = row.StartTime ? formatTime(row.StartTime) : '';

    return [freq, detail, time].filter(Boolean).join(' · ');
  };

  if (isLoading) {
    return (
      <div className="w-full bg-white border border-slate-200 rounded-xl p-8 text-center animate-pulse">
        <div className="space-y-4">
          <div className="h-6 bg-slate-100 rounded w-1/4 mx-auto" />
          <div className="h-10 bg-slate-50 rounded" />
          <div className="h-10 bg-slate-50 rounded" />
          <div className="h-10 bg-slate-50 rounded" />
        </div>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="w-full bg-white border border-slate-200 rounded-xl p-16 text-center text-slate-400 font-semibold shadow-sm">
        No services found.
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[1000px] border-collapse text-left text-sm text-slate-650">
        <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider sticky top-0 z-10">
          <tr>
            <th className="w-10 px-4 py-3.5"></th>
            <th className="px-4 py-3.5">Ref No</th>
            <th className="px-6 py-3.5">Customer / Agency</th>
            <th className="px-4 py-3.5">Property</th>
            <th className="px-6 py-3.5">Address</th>
            <th className="px-4 py-3.5">Type</th>
            <th className="px-4 py-3.5">Schedule Details</th>
            <th className="px-4 py-3.5">Status</th>
            <th className="px-4 py-3.5">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {services.map((row) => {
            const isExpanded = !!expandedRows[row.ServiceID];
            const ownerName = row.CustomerID 
              ? `${row.CustomerFirstName} ${row.CustomerSureName}` 
              : row.AgencyName;
            const propertyTypeDisplay = row.PropertyType 
              ? row.PropertyType.charAt(0).toUpperCase() + row.PropertyType.slice(1) 
              : 'Other';

            return (
              <React.Fragment key={row.ServiceID}>
                <tr 
                  className={`transition-colors duration-150 cursor-pointer ${isExpanded ? 'bg-slate-50/20' : 'hover:bg-slate-50/40'}`}
                  onClick={() => navigate(`/services/${row.ServiceID}`)}
                >
                  <td className="px-4 py-3.5 text-center" onClick={(e) => { e.stopPropagation(); toggleRow(row.ServiceID); }}>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-500 mx-auto" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400 mx-auto" />
                    )}
                  </td>
                  <td className="px-4 py-3.5 font-bold text-slate-800">{row.RefNo || '—'}</td>
                  <td className="px-6 py-3.5">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-700">{ownerName}</span>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                        {row.CustomerID ? 'Customer' : 'Agency Staff'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-slate-650">{propertyTypeDisplay}</td>
                  <td className="px-6 py-3.5">
                    <div className="flex flex-col text-xs">
                      <span className="font-semibold text-slate-700">{row.AddressLine}</span>
                      <span className="text-slate-450">{row.City}, {row.PostCode}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">{getTypeBadge(row.Type)}</td>
                  <td className="px-4 py-3.5 font-bold text-slate-700 text-xs">
                    {row.Type === 'one_off' && row.StartDate 
                      ? formatDate(row.StartDate) 
                      : formatScheduleRule(row)}
                  </td>
                  <td className="px-4 py-3.5">
                    {getStatusBadge(row)}
                  </td>
                  <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-3">
                      {row.IsPauseRequested === 1 && (
                        <button
                          onClick={() => onOpenPauseModal(row)}
                          className="px-2 py-1 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-600 rounded text-[10px] font-bold uppercase transition-colors"
                          title="Manage Pause Request"
                        >
                          Resolve Pause
                        </button>
                      )}
                      <button
                        onClick={() => onEdit(row)}
                        className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition-colors"
                        title="Edit Service"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(row)}
                        className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-600 transition-colors"
                        title="Delete Service"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                {/* Expanded Row */}
                {isExpanded && (
                  <tr>
                    <td colSpan="9" className="px-12 py-3 bg-slate-50/30 border-t border-b border-slate-100 text-left">
                      {loadingSchedule[row.ServiceID] ? (
                        <div className="flex items-center gap-2 py-4">
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-brand-accent" />
                          <span className="text-xs text-slate-400 font-semibold">Loading upcoming schedules...</span>
                        </div>
                      ) : (
                        <ServiceScheduleSubTable schedule={schedules[row.ServiceID] || []} />
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ServiceTable;
