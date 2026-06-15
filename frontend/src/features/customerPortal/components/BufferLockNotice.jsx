import React from 'react';
import { Lock, HelpCircle } from 'lucide-react';

export const BufferLockNotice = ({ message }) => {
  return (
    <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-start gap-2 text-[11px] text-amber-800 text-left font-semibold">
      <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
      <div className="space-y-0.5">
        <p className="font-bold leading-tight">Schedule Locked</p>
        <p className="text-slate-500 font-medium leading-relaxed">
          {message || 'This clean is within the request lock period. For late reschedules or cancellations, please contact customer support directly.'}
        </p>
      </div>
    </div>
  );
};

export default BufferLockNotice;
