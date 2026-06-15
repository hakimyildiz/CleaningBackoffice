import React from 'react';
import { formatDate, formatTime } from '../../../utils/formatters';
import { Lock, Clock, Calendar, MapPin, User, Users } from 'lucide-react';

export const AgencyScheduleTable = ({ schedule, role, onRequestChange }) => {
  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'scheduled':
        return <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100">Scheduled</span>;
      case 'in_progress':
        return (
          <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            In Progress
          </span>
        );
      case 'completed':
        return <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-green-50 text-green-600 border border-green-100">Completed</span>;
      case 'missed':
        return <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-100">Missed</span>;
      case 'cancelled':
        return <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">Cancelled</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-slate-50 text-slate-500">{status}</span>;
    }
  };

  const getDayName = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-GB', { weekday: 'short' });
  };

  const showRequestBtn = role === 'agency_staff' || role === 'agency_manager';

  if (!schedule || schedule.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 font-semibold text-xs italic shadow-xs">
        No scheduled cleanings found.
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs">
      {/* Desktop view: Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">Date & Time</th>
              <th className="px-6 py-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">Property Address</th>
              <th className="px-6 py-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">Assigned Staff</th>
              <th className="px-6 py-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">Assigned Cleaners</th>
              <th className="px-6 py-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">Status</th>
              {showRequestBtn && (
                <th className="px-6 py-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider text-right">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {schedule.map((job, index) => (
              <tr key={job.ServiceRecordID || index} className="hover:bg-slate-50/50 transition-colors">
                {/* Date & Time */}
                <td className="px-6 py-4.5 whitespace-nowrap text-xs font-semibold text-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase">
                      {getDayName(job.ScheduledDate)}
                    </span>
                    <span className="font-bold text-slate-800">{formatDate(job.ScheduledDate)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 font-semibold mt-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatTime(job.ScheduledStart)} ({parseFloat(job.EstimatedHours || job.ActualHours || 0)} hrs)</span>
                  </div>
                </td>

                {/* Property Address */}
                <td className="px-6 py-4.5 text-xs font-semibold text-slate-700">
                  <div className="font-bold text-slate-800">{job.AddressLine}</div>
                  <div className="text-[11px] text-slate-400 font-semibold mt-0.5">{job.City}</div>
                </td>

                {/* Assigned Staff */}
                <td className="px-6 py-4.5 whitespace-nowrap text-xs font-semibold text-slate-600">
                  {job.StaffFirstName ? (
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{job.StaffFirstName} {job.StaffSureName}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">None Assigned</span>
                  )}
                </td>

                {/* Assigned Cleaners */}
                <td className="px-6 py-4.5 text-xs font-semibold text-slate-600">
                  {job.AssignedCleaners ? (
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[200px]" title={job.AssignedCleaners}>
                        {job.AssignedCleaners}
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">No Cleaners</span>
                  )}
                </td>

                {/* Status */}
                <td className="px-6 py-4.5 whitespace-nowrap">
                  {getStatusBadge(job.Status)}
                </td>

                {/* Actions */}
                {showRequestBtn && (
                  <td className="px-6 py-4.5 whitespace-nowrap text-right text-xs">
                    {job.Status?.toLowerCase() === 'scheduled' ? (
                      job.isLocked ? (
                        <div 
                          className="inline-flex items-center gap-1 text-slate-400 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl text-[10px] font-bold select-none cursor-not-allowed"
                          title={job.lockMessage}
                        >
                          <Lock className="w-3 h-3 text-slate-400" />
                          <span>Locked</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => onRequestChange(job)}
                          className="bg-white hover:bg-brand-accent/5 text-slate-700 hover:text-brand-accent border border-slate-200 hover:border-brand-accent/30 px-3 py-1.5 rounded-xl font-bold transition-all shadow-2xs"
                        >
                          Request Change
                        </button>
                      )
                    ) : (
                      <span className="text-slate-400 italic text-[11px] font-semibold">No actions available</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile view: Stacked List */}
      <div className="md:hidden divide-y divide-slate-100">
        {schedule.map((job, index) => (
          <div key={job.ServiceRecordID || index} className="p-4 space-y-3.5 text-xs font-semibold text-slate-600">
            {/* Header info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase">
                  {getDayName(job.ScheduledDate)}
                </span>
                <span className="font-bold text-slate-800">{formatDate(job.ScheduledDate)}</span>
              </div>
              <div>{getStatusBadge(job.Status)}</div>
            </div>

            {/* Address & Time */}
            <div className="space-y-1.5">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-800">{job.AddressLine}</div>
                  <div className="text-[11px] text-slate-400 font-semibold">{job.City}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-slate-500 pl-6">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>{formatTime(job.ScheduledStart)} ({parseFloat(job.EstimatedHours || job.ActualHours || 0)} hrs est.)</span>
              </div>
            </div>

            {/* Assignments row */}
            <div className="grid grid-cols-2 gap-3 pl-6 pt-1 border-t border-slate-100/50">
              <div>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Assigned Staff</span>
                {job.StaffFirstName ? (
                  <span className="text-slate-700 font-bold text-[11px] block mt-0.5">{job.StaffFirstName} {job.StaffSureName[0]}.</span>
                ) : (
                  <span className="text-slate-400 italic text-[11px] block mt-0.5">None</span>
                )}
              </div>
              <div>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Cleaners</span>
                {job.AssignedCleaners ? (
                  <span className="text-slate-700 font-bold text-[11px] block mt-0.5 truncate max-w-[120px]" title={job.AssignedCleaners}>
                    {job.AssignedCleaners}
                  </span>
                ) : (
                  <span className="text-slate-400 italic text-[11px] block mt-0.5">None</span>
                )}
              </div>
            </div>

            {/* Action Row */}
            {showRequestBtn && job.Status?.toLowerCase() === 'scheduled' && (
              <div className="pt-2 flex justify-end">
                {job.isLocked ? (
                  <div 
                    className="flex items-center gap-1.5 text-slate-400 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl text-[10px] font-bold select-none cursor-not-allowed w-full justify-center"
                    title={job.lockMessage}
                  >
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Changes Locked &mdash; Contact Support</span>
                  </div>
                ) : (
                  <button
                    onClick={() => onRequestChange(job)}
                    className="w-full bg-brand-accent hover:bg-brand-accent/90 text-slate-900 py-2 rounded-xl font-bold transition-all text-center shadow-2xs"
                  >
                    Request Change
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgencyScheduleTable;
