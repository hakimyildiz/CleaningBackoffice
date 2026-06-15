import React from 'react';
import { formatDate, formatTime } from '../../../utils/formatters';
import { Calendar, Clock, MapPin, Lock } from 'lucide-react';
import Button from '../../../components/common/Button';

export const UpcomingJobsList = ({ upcomingJobs, onRequestChange }) => {
  const getDayName = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-GB', { weekday: 'long' });
  };

  if (!upcomingJobs || upcomingJobs.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center text-slate-400 font-semibold text-xs italic">
        No upcoming scheduled cleanings.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {upcomingJobs.map((job, index) => (
        <div 
          key={job.serviceRecordId || index} 
          className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left"
        >
          {/* Details Column */}
          <div className="space-y-2 text-xs font-semibold text-slate-600">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-lg text-[10px] uppercase tracking-wider">
                {getDayName(job.scheduledDate)}
              </span>
              <span className="font-bold text-slate-800">
                {formatDate(job.scheduledDate)}
              </span>
              <span className="text-slate-300">•</span>
              <span className="inline-flex items-center gap-1 text-slate-500">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {formatTime(job.scheduledStart)} ({job.estimatedHours} hrs est.)
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-500">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{job.address}</span>
            </div>
          </div>

          {/* Action Column */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {job.isLocked ? (
              <div 
                className="flex items-center gap-1.5 text-slate-400 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl text-[11px] font-bold select-none cursor-not-allowed"
                title={job.lockMessage}
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Locked</span>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRequestChange(job)}
                className="text-xs font-bold py-1.5 px-3 hover:bg-brand-accent/5 hover:border-brand-accent/30 hover:text-brand-accent"
              >
                Request Change
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default UpcomingJobsList;
