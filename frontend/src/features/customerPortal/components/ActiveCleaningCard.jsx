import React from 'react';
import { RefreshCw, MapPin, Clock, Users } from 'lucide-react';
import { formatTime } from '../../../utils/formatters';

export const ActiveCleaningCard = ({ activeJob, todayScheduledJob, onRefresh, loading }) => {
  if (activeJob) {
    return (
      <div className="bg-white border-2 border-emerald-500 rounded-3xl p-6 shadow-md relative overflow-hidden transition-all text-left">
        {/* Pulsing indicator */}
        <div className="flex items-center gap-2 mb-4">
          <span className="relative flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
          </span>
          <span className="text-sm font-black text-emerald-600 uppercase tracking-wider">
            Cleaning in Progress
          </span>
        </div>

        <h3 className="text-lg font-black text-slate-800 tracking-tight mb-3">
          Our team is currently on-site!
        </h3>

        <div className="space-y-2.5 text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
            <span>{activeJob.address}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Started at: {formatTime(activeJob.checkedInAt)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400 shrink-0" />
            <span>{activeJob.cleanerCount} cleaner(s) checked in</span>
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="mt-5 w-full bg-slate-50 hover:bg-slate-100 disabled:opacity-50 text-slate-700 font-bold py-2.5 px-4 rounded-2xl border border-slate-200 flex items-center justify-center gap-2 transition-all text-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Live Status</span>
        </button>
      </div>
    );
  }

  if (todayScheduledJob) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs relative overflow-hidden transition-all text-left">
        <div className="flex items-center gap-2 mb-4">
          <span className="relative flex h-3 w-3">
            <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-accent"></span>
          </span>
          <span className="text-sm font-black text-brand-accent uppercase tracking-wider">
            Scheduled for Today
          </span>
        </div>

        <h3 className="text-lg font-black text-slate-800 tracking-tight mb-3">
          Cleaning scheduled today
        </h3>

        <div className="space-y-2.5 text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
            <span>{todayScheduledJob.address}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Expected arrival: {formatTime(todayScheduledJob.expectedArrival)}</span>
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="mt-5 w-full bg-slate-50 hover:bg-slate-100 disabled:opacity-50 text-slate-700 font-bold py-2.5 px-4 rounded-2xl border border-slate-200 flex items-center justify-center gap-2 transition-all text-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Check Active Status</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs text-center text-slate-400 font-semibold text-xs italic py-10">
      No cleaning active or scheduled for today.
    </div>
  );
};

export default ActiveCleaningCard;
