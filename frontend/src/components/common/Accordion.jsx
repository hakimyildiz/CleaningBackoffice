import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export const Accordion = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden transition-all duration-200">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-6 py-4 bg-slate-50/40 hover:bg-slate-50/90 border-b border-transparent transition-colors focus:outline-none select-none"
      >
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{title}</span>
        <ChevronDown
          className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`}
        />
      </button>
      <div
        className={`transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-[1000px] border-t border-slate-200 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        }`}
      >
        <div className="p-6 bg-white">{children}</div>
      </div>
    </div>
  );
};

export default Accordion;
