import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/useToast';
import agencyPortalService from '../services/agencyPortalService';
import { formatDate, formatTime, formatGBP } from '../../../utils/formatters';
import { 
  Sparkles, Building2, ClipboardList, Receipt, 
  AlertTriangle, Coins, ArrowUpRight, ShieldAlert,
  Calendar, Users
} from 'lucide-react';

export const AgencyHomePage = () => {
  const { user, role } = useAuth();
  const { addToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const result = await agencyPortalService.getOverview();
        setData(result.data);
      } catch (err) {
        addToast('Failed to load agency dashboard.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, [addToast]);

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'scheduled':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100">Scheduled</span>;
      case 'in_progress':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            In Progress
          </span>
        );
      case 'completed':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-600 border border-green-100">Completed</span>;
      case 'missed':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-100">Missed</span>;
      case 'cancelled':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">Cancelled</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 text-slate-500">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-accent border-r-2" />
      </div>
    );
  }

  const showStaffWidgets = role === 'agency_staff' || role === 'agency_manager';
  const showBillingWidgets = role === 'agency_bookkeeper' || role === 'agency_manager';

  return (
    <div className="space-y-8 text-left max-w-5xl mx-auto">
      {/* Dynamic greeting header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200/80 pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-brand-accent animate-pulse" />
            <span>Welcome, {user?.FirstName}!</span>
          </h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5">
            {role?.replace('_', ' ')} Dashboard for {user?.CompanyName || 'Your Agency'}
          </p>
        </div>
      </div>

      {/* Widget Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Properties Widget */}
        {showStaffWidgets && (
          <Link 
            to="/agency-portal/properties"
            className="bg-white border border-slate-200 hover:border-indigo-200 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all duration-300 flex items-center justify-between group"
          >
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                {role === 'agency_staff' ? 'My Properties' : 'Agency Properties'}
              </span>
              <span className="text-2xl font-black text-slate-850 block mt-1">
                {data?.propertyCount || 0}
              </span>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-500 rounded-2xl group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
              <Building2 className="w-5 h-5 shrink-0" />
            </div>
          </Link>
        )}

        {/* Change Requests Widget */}
        {showStaffWidgets && (
          <Link 
            to="/agency-portal/requests"
            className="bg-white border border-slate-200 hover:border-emerald-200 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all duration-300 flex items-center justify-between group"
          >
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                Pending Requests
              </span>
              <span className="text-2xl font-black text-slate-850 block mt-1">
                {data?.pendingRequestsCount || 0}
              </span>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
              <ClipboardList className="w-5 h-5 shrink-0" />
            </div>
          </Link>
        )}

        {/* Invoiced this Month Widget */}
        {showBillingWidgets && (
          <Link 
            to="/agency-portal/invoices"
            className="bg-white border border-slate-200 hover:border-blue-200 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all duration-300 flex items-center justify-between group"
          >
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                Invoiced this Month
              </span>
              <span className="text-xl font-black text-slate-850 block mt-1 truncate max-w-[130px]">
                {formatGBP(data?.billing?.totalInvoicedThisMonth)}
              </span>
            </div>
            <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
              <Receipt className="w-5 h-5 shrink-0" />
            </div>
          </Link>
        )}

        {/* Outstanding / Credit Widget */}
        {showBillingWidgets && (
          <Link 
            to="/agency-portal/invoices"
            className="bg-white border border-slate-200 hover:border-amber-200 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all duration-300 flex items-center justify-between group"
          >
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                Outstanding Balance
              </span>
              <span className="text-xl font-black text-slate-850 block mt-1 truncate max-w-[130px]">
                {formatGBP(data?.billing?.openInvoiceDebt)}
              </span>
            </div>
            <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl group-hover:bg-amber-500 group-hover:text-white transition-all duration-300">
              <AlertTriangle className="w-5 h-5 shrink-0" />
            </div>
          </Link>
        )}
      </div>

      {/* Recent Activity Table */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
          Recent Activity (Last 5 Scheduled Entries)
        </h2>

        {!data?.recentActivity || data.recentActivity.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center text-slate-400 font-semibold text-xs italic shadow-xs">
            No recent cleanings recorded.
          </div>
        ) : (
          <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider select-none">
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Property</th>
                    <th className="px-6 py-4">Assigned Cleaners</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-600">
                  {data.recentActivity.map((act, idx) => (
                    <tr key={act.ServiceRecordID || idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-bold text-slate-700">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDate(act.ScheduledDate)}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">{formatTime(act.ScheduledStart)}</span>
                      </td>
                      <td className="px-6 py-4.5">
                        <div className="font-bold text-slate-800">{act.AddressLine}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{act.City}</div>
                      </td>
                      <td className="px-6 py-4.5">
                        {act.AssignedCleaners ? (
                          <div className="flex items-center gap-1 text-slate-700">
                            <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[200px]" title={act.AssignedCleaners}>
                              {act.AssignedCleaners}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic font-medium">None</span>
                        )}
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        {getStatusBadge(act.Status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgencyHomePage;
