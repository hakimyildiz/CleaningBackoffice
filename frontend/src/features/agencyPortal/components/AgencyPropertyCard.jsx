import React, { useState } from 'react';
import { formatDate, formatTime } from '../../../utils/formatters';
import { 
  Building2, Home, Store, Clock, User, Calendar, 
  ChevronDown, ChevronUp, CheckCircle2, XCircle, AlertCircle, HelpCircle
} from 'lucide-react';

export const AgencyPropertyCard = ({ property, role, onRequestChange }) => {
  const [expanded, setExpanded] = useState(false);

  const getPropertyIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'domestic':
      case 'house':
      case 'apartment':
        return <Home className="w-5 h-5 text-indigo-500" />;
      case 'office':
      case 'commercial':
        return <Building2 className="w-5 h-5 text-blue-500" />;
      case 'retail':
      case 'store':
        return <Store className="w-5 h-5 text-emerald-500" />;
      default:
        return <Building2 className="w-5 h-5 text-slate-500" />;
    }
  };

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

  const getFrequencyLabel = (freq) => {
    switch (freq?.toLowerCase()) {
      case 'one_off': return 'One-off';
      case 'weekly': return 'Weekly';
      case 'biweekly': return 'Bi-weekly';
      case 'monthly': return 'Monthly';
      default: return freq || 'Regular';
    }
  };

  const showRequestBtn = role === 'agency_staff' || role === 'agency_manager';
  const showStaffName = role === 'agency_manager';

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-md hover:border-slate-300/60 shadow-xs">
      {/* Header Info */}
      <div 
        onClick={() => setExpanded(!expanded)}
        className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
      >
        <div className="flex items-start gap-4">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            {getPropertyIcon(property.PropertyType)}
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 leading-snug">
              {property.AddressLine}
            </h3>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
              {property.City}, {property.PostCode}
            </p>
            
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2.5">
              <span className="px-2 py-0.5 text-[9px] font-bold text-slate-500 bg-slate-100 rounded-lg">
                {getFrequencyLabel(property.Frequency)}
              </span>
              
              {property.CustomerFirstName && (
                <span className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  {property.CustomerFirstName} {property.CustomerSureName}
                </span>
              )}

              {property.StartTime && (
                <span className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {formatTime(property.StartTime)} {property.DayOfWeek ? `on ${property.DayOfWeek}` : ''}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-6 border-t border-slate-100 pt-3 md:border-0 md:pt-0">
          <div className="text-left md:text-right">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Next Cleaning
            </span>
            {property.NextCleaningDate ? (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-bold text-slate-700">
                  {formatDate(property.NextCleaningDate)}
                </span>
                {getStatusBadge(property.NextCleaningStatus)}
              </div>
            ) : (
              <span className="text-xs font-semibold text-slate-400 italic block mt-0.5">
                None Scheduled
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {showStaffName && property.StaffFirstName && (
              <div className="text-right hidden lg:block">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Staff
                </span>
                <span className="text-xs font-bold text-slate-700 block mt-0.5">
                  {property.StaffFirstName} {property.StaffSureName[0]}.
                </span>
              </div>
            )}
            <div className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors">
              {expanded ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Section */}
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/50 p-5 space-y-4 transition-all duration-300">
          <div>
            <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2.5">
              Recent Activity (Last 3 cleanings)
            </h4>
            
            {!property.lastRecords || property.lastRecords.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">No cleaning history recorded for this property yet.</p>
            ) : (
              <div className="space-y-2">
                {property.lastRecords.map((record, index) => {
                  const duration = record.ActualHours || record.EstimatedHours;
                  return (
                    <div 
                      key={index}
                      className="bg-white border border-slate-200/60 rounded-2xl p-3 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="font-bold text-slate-700">
                          {formatDate(record.ScheduledDate)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <span className="text-slate-500 font-semibold">
                          {duration ? `${parseFloat(duration)} hrs` : 'N/A'}
                        </span>
                        {getStatusBadge(record.Status)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="text-[11px] text-slate-400 font-semibold">
              Beds: <strong className="text-slate-600 font-bold">{property.Beds || 0}</strong> &middot;{' '}
              Baths: <strong className="text-slate-600 font-bold">{property.Bathrooms || 0}</strong> &middot;{' '}
              Kitchens: <strong className="text-slate-600 font-bold">{property.Kitchens || 0}</strong>
              {property.HasPet === 1 && <span className="ml-2 text-slate-500">🐾 Pet Friendly</span>}
            </div>

            {showRequestBtn && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRequestChange(property);
                }}
                className="bg-brand-accent hover:bg-brand-accent/90 text-slate-900 px-4 py-2 text-xs font-bold rounded-2xl shadow-xs transition-colors"
              >
                Request Change
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AgencyPropertyCard;
