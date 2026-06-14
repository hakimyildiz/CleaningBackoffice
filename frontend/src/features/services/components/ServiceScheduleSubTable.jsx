import React from 'react';
import { formatDate, formatTime } from '../../../utils/formatters';

export const ServiceScheduleSubTable = ({ schedule = [] }) => {
  // Show only next 5 upcoming schedule entries
  const upcoming = schedule.slice(0, 5);

  const getDayName = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { weekday: 'short' });
  };

  const getStatusBadge = (status) => {
    const base = "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border";
    switch (status) {
      case 'scheduled':
        return (
          <span className={`${base} bg-blue-500/10 border-blue-500/20 text-blue-500`}>
            Scheduled
          </span>
        );
      case 'cancelled':
        return (
          <span className={`${base} bg-red-500/10 border-red-500/20 text-red-500 line-through`}>
            Cancelled
          </span>
        );
      case 'skipped':
        return (
          <span className={`${base} bg-slate-500/10 border-slate-500/20 text-slate-400`}>
            Skipped
          </span>
        );
      case 'completed':
        return (
          <span className={`${base} bg-emerald-500/10 border-emerald-500/20 text-emerald-500`}>
            Completed
          </span>
        );
      default:
        return (
          <span className={`${base} bg-slate-500/10 border-slate-500/20 text-slate-400`}>
            {status}
          </span>
        );
    }
  };

  if (upcoming.length === 0) {
    return (
      <div className="text-xs text-slate-400 font-semibold italic p-4 text-center">
        No schedule occurrences generated for this service yet.
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-50/40 rounded-xl border border-slate-150 overflow-hidden mt-2 max-w-3xl">
      <div className="px-4 py-2 bg-slate-100/60 border-b border-slate-150 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
        Upcoming Appointments (Next 5 rows)
      </div>
      <table className="w-full border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-slate-150 text-slate-450 font-bold uppercase">
            <th className="px-4 py-2">Date</th>
            <th className="px-4 py-2">Day</th>
            <th className="px-4 py-2">Start Time</th>
            <th className="px-4 py-2">Est. Hours</th>
            <th className="px-4 py-2">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {upcoming.map((row) => (
            <tr key={row.ServiceRecordID} className="hover:bg-slate-50/80 transition-colors">
              <td className="px-4 py-2 font-semibold text-slate-700">{formatDate(row.ScheduledDate)}</td>
              <td className="px-4 py-2 font-medium text-slate-500">{getDayName(row.ScheduledDate)}</td>
              <td className="px-4 py-2 font-medium text-slate-650">{formatTime(row.ScheduledStart)}</td>
              <td className="px-4 py-2 font-bold text-slate-700">{parseFloat(row.EstimatedHours).toFixed(1)} hrs</td>
              <td className="px-4 py-2">{getStatusBadge(row.Status)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ServiceScheduleSubTable;
