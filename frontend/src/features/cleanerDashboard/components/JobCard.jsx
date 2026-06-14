import React from 'react';
import Badge from '../../../components/common/Badge';
import { formatDate, formatTime } from '../../../utils/formatters';
import { Calendar, Clock, MapPin, User, Home, UserCheck, AlertTriangle } from 'lucide-react';

export const JobCard = ({ 
  job, 
  variant = 'today', // 'past' | 'today' | 'upcoming'
  onClick,
  children 
}) => {
  const isCompleted = job.Status === 'completed';
  const isCancelled = job.Status === 'cancelled';
  const isMissed = job.Status === 'missed';
  const isInProgress = job.Status === 'in_progress';
  const hasActiveRecord = job.hasActiveRecord === 1 || job.hasActiveRecord === true;

  const ownerName = job.CustomerID 
    ? `${job.CustomerFirstName} ${job.CustomerSureName}`
    : job.AgencyName;

  // Visual card styles
  let cardClass = 'bg-white border rounded-2xl p-5 shadow-xs text-left transition-all duration-200 ';
  
  if (variant === 'past') {
    cardClass += 'border-slate-200 opacity-75';
  } else if (variant === 'upcoming') {
    cardClass += 'border-blue-100 hover:border-blue-200 hover:shadow-sm bg-blue-50/10';
  } else {
    // Today
    if (isInProgress || hasActiveRecord) {
      cardClass += 'border-rose-450 shadow-md ring-1 ring-rose-400 bg-rose-50/5 animate-pulse-slow';
    } else if (isCompleted) {
      cardClass += 'border-emerald-200 bg-emerald-50/5';
    } else {
      cardClass += 'border-slate-200 hover:border-slate-300 hover:shadow-sm';
    }
  }

  const getStatusBadge = () => {
    if (isInProgress || hasActiveRecord) {
      return <Badge variant="warning">In Progress</Badge>;
    }
    if (isCompleted) {
      return <Badge variant="success">Completed</Badge>;
    }
    if (isCancelled) {
      return <Badge variant="danger">Cancelled</Badge>;
    }
    if (isMissed) {
      return <Badge variant="danger">Missed</Badge>;
    }
    return <Badge variant="info">Scheduled</Badge>;
  };

  return (
    <div className={cardClass} onClick={onClick}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-[10px] font-black tracking-wider uppercase bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200">
            {job.RefNo || 'No Ref'}
          </span>
          <h4 className="text-base font-bold text-slate-800 mt-2 flex items-center gap-1.5">
            <User className="w-4 h-4 text-slate-400" />
            {ownerName}
          </h4>
        </div>
        <div>
          {getStatusBadge()}
        </div>
      </div>

      <div className="mt-4 space-y-2 text-xs font-semibold text-slate-600">
        <p className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span>{job.ServiceAddressLine || job.AddressLine}, {job.ServiceCity || job.City} ({job.ServicePostCode || job.PostCode})</span>
        </p>
        <p className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span>{formatDate(job.ScheduledDate)}</span>
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
            {formatTime(job.ScheduledStart)} ({job.EstimatedHours}h estimated)
          </span>
          <span className="flex items-center gap-1.5">
            <Home className="w-4 h-4 text-slate-400 flex-shrink-0" />
            {job.PropertyType ? job.PropertyType.charAt(0).toUpperCase() + job.PropertyType.slice(1) : 'House'}
          </span>
        </div>
        
        {job.partners && job.partners.length > 0 && (
          <div className="flex items-start gap-2 pt-2 border-t border-slate-100 mt-2">
            <UserCheck className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-500">
              <span className="font-bold text-slate-600">Assigned partners: </span>
              {job.partners.join(', ')}
            </div>
          </div>
        )}
      </div>

      {children && (
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-end gap-3" onClick={e => e.stopPropagation()}>
          {children}
        </div>
      )}
    </div>
  );
};

export default JobCard;
