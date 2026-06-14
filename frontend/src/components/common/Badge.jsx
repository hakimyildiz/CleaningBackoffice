import React from 'react';

export const Badge = ({ variant, children }) => {
  const roleStyles = {
    admin: 'bg-red-50 text-red-700 border-red-200/50',
    manager: 'bg-orange-50 text-orange-700 border-orange-200/50',
    cleaner_manager: 'bg-amber-50 text-amber-700 border-amber-200/50',
    cleaner: 'bg-emerald-50 text-emerald-700 border-emerald-200/50',
    customer: 'bg-blue-50 text-blue-700 border-blue-200/50',
    agency_manager: 'bg-purple-50 text-purple-700 border-purple-200/50',
    agency_bookkeeper: 'bg-pink-50 text-pink-700 border-pink-200/50',
    agency_staff: 'bg-teal-50 text-teal-700 border-teal-200/50'
  };

  if (variant === 'active' || variant === 'inactive') {
    const isActive = variant === 'active';
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
        isActive 
          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
          : 'bg-slate-500/10 border-slate-500/20 text-slate-400'
      }`}>
        <span className={`w-1 h-1 rounded-full ${isActive ? 'bg-emerald-550 animate-pulse' : 'bg-slate-400'}`} />
        {children || (isActive ? 'Active' : 'Inactive')}
      </span>
    );
  }

  const baseStyles = 'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold border tracking-wider uppercase';
  const matchedStyle = roleStyles[variant] || 'bg-slate-55 text-slate-650 border-slate-200';

  return (
    <span className={`${baseStyles} ${matchedStyle}`}>
      {children}
    </span>
  );
};

export default Badge;
