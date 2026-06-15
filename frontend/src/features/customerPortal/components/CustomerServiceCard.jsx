import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Building2, Store, Landmark, Info, Key, Check } from 'lucide-react';
import { formatTime } from '../../../utils/formatters';

const getPropertyIcon = (type) => {
  switch (type) {
    case 'house': return Home;
    case 'office': return Building2;
    case 'shop': return Store;
    case 'apartment': return Landmark;
    default: return Info;
  }
};

export const CustomerServiceCard = ({ service }) => {
  const Icon = getPropertyIcon(service.PropertyType);
  const isRegular = service.Type === 'regular';

  // Format schedule text
  const getScheduleText = () => {
    if (!isRegular) return 'One-off Clean Service';
    const day = service.DayOfWeek || 'Day';
    const time = service.StartTime ? formatTime(service.StartTime) : '09:00';
    const freq = service.Frequency || 'weekly';
    return `Every ${day} at ${time} (${freq})`;
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs hover:shadow-sm transition-all text-left flex flex-col justify-between h-full">
      <div className="space-y-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-500">
            <Icon className="w-5 h-5" />
          </div>
          <span className={`px-2.5 py-0.5 border rounded-full text-[10px] font-bold uppercase tracking-wider ${
            isRegular 
              ? 'bg-brand-accent/10 text-brand-accent border-brand-accent/20' 
              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
          }`}>
            {isRegular ? 'Regular' : 'One-Off'}
          </span>
        </div>

        {/* Address and schedule */}
        <div className="space-y-1">
          <h3 className="font-black text-slate-800 text-sm tracking-tight leading-snug truncate">
            {service.AddressLine}
          </h3>
          <p className="text-xs text-slate-500 font-semibold truncate">
            {service.City}, {service.PostCode}
          </p>
          <p className="text-[11px] font-bold text-slate-700 mt-2 flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            {getScheduleText()}
          </p>
        </div>

        {/* Specs icons row */}
        <div className="flex items-center gap-4 text-[11px] font-bold text-slate-500 bg-slate-50/60 p-2.5 rounded-xl border border-slate-100/50">
          <span title="Bedrooms">🛏️ {service.Beds || 0}</span>
          <span title="Bathrooms">🚿 {service.Bathrooms || 0}</span>
          <span title="Kitchens">🍳 {service.Kitchens || 0}</span>
          {service.HasPet && (
            <span title="Pets on-site" className="text-amber-600 flex items-center gap-0.5">
              🐾 Yes
            </span>
          )}
        </div>
      </div>

      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Ref: {service.RefNo || '—'}
        </span>
        <Link 
          to={`/customer-portal/schedule?serviceId=${service.ServiceID}`}
          className="text-xs font-bold text-brand-accent hover:underline"
        >
          View Schedule →
        </Link>
      </div>
    </div>
  );
};

export default CustomerServiceCard;
