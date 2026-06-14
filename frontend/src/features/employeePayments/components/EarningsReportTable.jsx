import React from 'react';
import { formatGBP } from '../../../utils/formatters';
import Button from '../../../components/common/Button';

const EarningsReportTable = ({ report, onMarkAsPaidClick }) => {
  // Calculate Grand Totals
  const totalJobs = report.reduce((sum, r) => sum + r.totalJobs, 0);
  const totalHours = report.reduce((sum, r) => sum + r.totalActualHours, 0);
  const totalExpected = report.reduce((sum, r) => sum + r.expectedPayment, 0);
  const totalPaid = report.reduce((sum, r) => sum + r.alreadyPaid, 0);
  const totalBalance = report.reduce((sum, r) => sum + r.balance, 0);

  const getBalanceBadge = (balance) => {
    if (balance > 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
          {formatGBP(balance)} owed
        </span>
      );
    } else if (balance === 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-50 text-slate-500 border border-slate-100">
          Settled
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-100">
          {formatGBP(Math.abs(balance))} overpaid
        </span>
      );
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'cleaner':
        return 'Cleaner';
      case 'cleaner_manager':
        return 'Cleaner Manager';
      case 'admin':
        return 'Admin';
      case 'manager':
        return 'Manager';
      default:
        return role;
    }
  };

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left text-xs font-semibold text-slate-650 border-collapse">
        <thead className="bg-slate-50 border-b border-slate-200/60 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          <tr>
            <th className="px-6 py-3.5">Employee Name</th>
            <th className="px-6 py-3.5">Role</th>
            <th className="px-6 py-3.5">Hourly Rate</th>
            <th className="px-6 py-3.5 text-center">Total Jobs</th>
            <th className="px-6 py-3.5 text-center">Total Hours</th>
            <th className="px-6 py-3.5 right-align text-right">Expected Pay</th>
            <th className="px-6 py-3.5 right-align text-right">Already Paid</th>
            <th className="px-6 py-3.5 text-center">Balance</th>
            <th className="px-6 py-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {report.length === 0 ? (
            <tr>
              <td colSpan={9} className="px-6 py-10 text-center text-slate-400 italic">
                No active timesheet summaries for selected period range.
              </td>
            </tr>
          ) : (
            <>
              {report.map((r) => (
                <tr key={r.employeeId} className="hover:bg-slate-50/40 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-800">
                    {r.fullName}
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-medium">
                    {getRoleLabel(r.role)}
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-medium">
                    {formatGBP(r.rate)}/hr
                  </td>
                  <td className="px-6 py-4 text-center text-slate-600 font-bold">
                    {r.totalJobs}
                  </td>
                  <td className="px-6 py-4 text-center text-slate-600 font-bold">
                    {r.totalActualHours}h
                  </td>
                  <td className="px-6 py-4 text-right text-slate-900 font-black">
                    {formatGBP(r.expectedPayment)}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-900 font-semibold">
                    {formatGBP(r.alreadyPaid)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {getBalanceBadge(r.balance)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {r.balance > 0 ? (
                      <Button
                        variant="primary"
                        onClick={() => onMarkAsPaidClick(r)}
                        className="text-[10px] font-bold uppercase tracking-wider py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 border-emerald-600 shadow-xs"
                      >
                        Mark as Paid
                      </Button>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic font-medium">Settled</span>
                    )}
                  </td>
                </tr>
              ))}
              {/* Grand Summary Row */}
              <tr className="bg-slate-50/70 border-t-2 border-slate-200 font-black text-slate-800">
                <td className="px-6 py-4 font-black">Total Summary</td>
                <td className="px-6 py-4">—</td>
                <td className="px-6 py-4">—</td>
                <td className="px-6 py-4 text-center">{totalJobs}</td>
                <td className="px-6 py-4 text-center">{totalHours}h</td>
                <td className="px-6 py-4 text-right text-slate-950 text-sm">{formatGBP(totalExpected)}</td>
                <td className="px-6 py-4 text-right text-slate-950 text-sm">{formatGBP(totalPaid)}</td>
                <td className="px-6 py-4 text-center">
                  {getBalanceBadge(totalBalance)}
                </td>
                <td className="px-6 py-4">—</td>
              </tr>
            </>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default EarningsReportTable;
