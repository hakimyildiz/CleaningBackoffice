import React from 'react';
import { formatGBP } from '../../../utils/formatters';
import { Coins, AlertTriangle, Scale, HelpCircle } from 'lucide-react';

export const AgencyCreditWidget = ({ billingData }) => {
  if (!billingData) return null;

  const { creditBalance, openInvoiceDebt, netPosition } = billingData;

  const getBalanceColor = (val) => {
    if (val > 0) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (val < 0) return 'text-rose-600 bg-rose-50 border-rose-200';
    return 'text-slate-650 bg-slate-50 border-slate-200';
  };

  const getNetPositionColor = (val) => {
    if (val > 0) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (val < 0) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-slate-650 bg-slate-50 border-slate-200';
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-left">
      {/* Credit Balance Card */}
      <div className={`border-2 rounded-3xl p-5 shadow-xs flex items-center justify-between gap-4 transition-all duration-200 hover:shadow-sm ${getBalanceColor(creditBalance)}`}>
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider opacity-80 block">
            Prepaid Credit
          </span>
          <span className="text-xl font-black block mt-1">
            {formatGBP(creditBalance)}
          </span>
        </div>
        <div className="p-3 bg-white/60 rounded-2xl border border-black/5">
          <Coins className="w-5 h-5 shrink-0" />
        </div>
      </div>

      {/* Open Invoice Debt Card */}
      <div className="border-2 border-slate-200 bg-white rounded-3xl p-5 shadow-xs flex items-center justify-between gap-4 transition-all duration-200 hover:shadow-sm">
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
            Outstanding Invoices
          </span>
          <span className="text-xl font-black text-slate-800 block mt-1">
            {formatGBP(openInvoiceDebt)}
          </span>
        </div>
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
          <AlertTriangle className="w-5 h-5 text-slate-500 shrink-0" />
        </div>
      </div>

      {/* Net Position Card */}
      <div className={`border-2 rounded-3xl p-5 shadow-xs flex items-center justify-between gap-4 transition-all duration-200 hover:shadow-sm ${getNetPositionColor(netPosition)}`}>
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider opacity-80 block">
            Net Position
          </span>
          <span className="text-xl font-black block mt-1">
            {formatGBP(netPosition)}
          </span>
        </div>
        <div className="p-3 bg-white/60 rounded-2xl border border-black/5">
          <Scale className="w-5 h-5 shrink-0" />
        </div>
      </div>

      {/* Info Message */}
      <div className="sm:col-span-3 flex items-start gap-2 bg-blue-50 border border-blue-150 rounded-2xl p-3 text-[11px] text-blue-700 font-semibold shadow-2xs">
        <HelpCircle className="w-4 h-4 shrink-0 text-blue-500 mt-0.5" />
        <span>
          <strong>Billing Info:</strong> Credit balances are automatically applied to your next invoice. The net position shows your overall account standing (Prepaid Credit minus Outstanding Invoices).
        </span>
      </div>
    </div>
  );
};

export default AgencyCreditWidget;
