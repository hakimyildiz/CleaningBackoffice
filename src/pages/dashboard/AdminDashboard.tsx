"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { dashboardApi, type ServiceRecord, type DashboardStats } from '../../lib/api';
import { LuUsers as Users, LuBuilding2 as Building2, LuCalendar as Calendar, LuFileText as FileText, LuTrendingUp as TrendingUp, LuClock as Clock, LuCircleAlert as AlertCircle, LuCircleCheck as CheckCircle, LuPlus as Plus, LuArrowRight as ArrowRight } from 'react-icons/lu';

interface QuickAction {
  label: string;
  icon: React.ElementType;
  path: string;
  color: string;
}

const quickActions: QuickAction[] = [
  { label: 'Add Cleaner', icon: Users, path: '/cleaners/new', color: 'bg-blue-500' },
  { label: 'Add Customer', icon: Users, path: '/customers/new', color: 'bg-emerald-500' },
  { label: 'New Service', icon: Plus, path: '/services/new', color: 'bg-violet-500' },
  { label: 'Add Agency', icon: Building2, path: '/agencies/new', color: 'bg-amber-500' },
  { label: 'View Calendar', icon: Calendar, path: '/calendar', color: 'bg-rose-500' },
  { label: 'View Invoices', icon: FileText, path: '/invoices', color: 'bg-cyan-500' },
];

export function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    activeCleaners: 0,
    todayJobs: 0,
    completedToday: 0,
    pendingInvoices: 0,
    totalRevenue: 0,
    upcomingJobs: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const data = await dashboardApi.getStats();
      setStats(data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Customers', value: stats.totalCustomers, icon: Users, color: 'bg-blue-500', trend: '+12%' },
    { label: 'Active Cleaners', value: stats.activeCleaners, icon: Users, color: 'bg-emerald-500', trend: '+5%' },
    { label: "Today's Jobs", value: stats.todayJobs, icon: Calendar, color: 'bg-violet-500', trend: null },
    { label: 'Completed Today', value: stats.completedToday, icon: CheckCircle, color: 'bg-green-500', trend: null },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
          Welcome back, Administrator
        </h1>
        <p className="text-slate-500 mt-1">
          Here's what's happening with your cleaning service today.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl p-5 lg:p-6 shadow-sm border border-slate-100">
            <div className="flex items-start justify-between mb-4">
              <div className={`${stat.color} p-3 rounded-xl`}>
                <stat.icon className="h-5 w-5 text-white" />
              </div>
              {stat.trend && (
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                  {stat.trend}
                </span>
              )}
            </div>
            <p className="text-2xl lg:text-3xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className={`${action.color} p-2 rounded-lg`}>
                    <action.icon className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {stats.pendingInvoices > 0 && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-amber-800">Pending Invoices</p>
                  <p className="text-sm text-amber-600 mt-1">
                    {stats.pendingInvoices} invoices awaiting payment
                  </p>
                  <button className="mt-2 text-sm font-medium text-amber-700 hover:text-amber-800 flex items-center gap-1">
                    View invoices <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Upcoming Jobs</h2>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View all
              </button>
            </div>
            {stats.upcomingJobs.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p>No upcoming jobs scheduled</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.upcomingJobs.map((job) => (
                  <div
                    key={job.ServiceRecordID}
                    className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{job.AddressLine || 'Unknown Address'}</p>
                        <p className="text-sm text-slate-500">{job.City}, {job.PostCode}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-700">
                        {new Date(job.RecordDate).toLocaleDateString('en-GB', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        })}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        job.Status === 'Created' ? 'bg-blue-100 text-blue-700' :
                        job.Status === 'In Cleaning' ? 'bg-amber-100 text-amber-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {job.Status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
