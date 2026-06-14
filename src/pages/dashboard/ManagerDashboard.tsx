import { useState, useEffect } from 'react';
import { serviceRecordsApi, type ServiceRecord } from '../../lib/api';
import {
  Calendar,
  Clock,
  CheckCircle,
} from 'lucide-react';

export function ManagerDashboard() {
  const [todayJobs, setTodayJobs] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodayJobs();
  }, []);

  const fetchTodayJobs = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const records = await serviceRecordsApi.getAll({ date: today });
      setTodayJobs(records);
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const completedCount = todayJobs.filter((j) => j.Status === 'Cleaned' || j.Status === 'Invoice Sent').length;
  const inProgressCount = todayJobs.filter((j) => j.Status === 'In Cleaning').length;
  const pendingCount = todayJobs.filter((j) => j.Status === 'Created').length;

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
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Manager Dashboard</h1>
        <p className="text-slate-500 mt-1">Monitor and manage daily operations.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-blue-500 p-2 rounded-lg">
              <Calendar className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm text-slate-500">Total Jobs</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{todayJobs.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-amber-500 p-2 rounded-lg">
              <Clock className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm text-slate-500">In Progress</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{inProgressCount}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-green-500 p-2 rounded-lg">
              <CheckCircle className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm text-slate-500">Completed</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{completedCount}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-rose-500 p-2 rounded-lg">
              <Calendar className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm text-slate-500">Pending</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{pendingCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Today's Schedule</h2>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">View all</button>
        </div>
        {todayJobs.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Calendar className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p>No jobs scheduled for today</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayJobs.map((job) => (
              <div
                key={job.ServiceRecordID}
                className="flex items-center justify-between p-4 rounded-xl bg-slate-50"
              >
                <div>
                  <p className="font-medium text-slate-900">{job.AddressLine || 'Service Job'}</p>
                  <p className="text-sm text-slate-500">{job.Beds} beds, {job.Bathroom} baths</p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                  job.Status === 'Created' ? 'bg-blue-100 text-blue-700' :
                  job.Status === 'In Cleaning' ? 'bg-amber-100 text-amber-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {job.Status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
