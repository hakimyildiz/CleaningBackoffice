"use client";
import { useState, useEffect } from 'react';
import { cleanersApi, serviceRecordsApi, type Cleaner, type ServiceRecord } from '../../lib/api';
import { LuClock as Clock, LuUsers as Users, LuCircleCheck as CheckCircle, LuCalendar as Calendar, LuUserCheck as UserCheck } from 'react-icons/lu';

export function CleanerManagerDashboard() {
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [todayRecords, setTodayRecords] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [cleanersData, recordsData] = await Promise.all([
        cleanersApi.getAll({ isActive: true }),
        serviceRecordsApi.getAll({ date: today }),
      ]);
      setCleaners(cleanersData);
      setTodayRecords(recordsData);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const activeToday = todayRecords.filter((r) => r.Status === 'In Cleaning').length;
  const completedToday = todayRecords.filter((r) => r.Status === 'Cleaned' || r.Status === 'Invoice Sent').length;

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
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Cleaner Manager Dashboard</h1>
        <p className="text-slate-500 mt-1">Manage cleaner schedules and timesheets.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-blue-500 p-2 rounded-lg">
              <Users className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm text-slate-500">Active Cleaners</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{cleaners.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-violet-500 p-2 rounded-lg">
              <Clock className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm text-slate-500">Working Now</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{activeToday}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-green-500 p-2 rounded-lg">
              <CheckCircle className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm text-slate-500">Completed</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{completedToday}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-amber-500 p-2 rounded-lg">
              <Calendar className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm text-slate-500">Today's Jobs</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{todayRecords.length}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Active Cleaners</h2>
          <div className="space-y-3">
            {cleaners.slice(0, 5).map((cleaner) => (
              <div key={cleaner.CleanerID} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <UserCheck className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">
                    {cleaner.FirstName} {cleaner.SureName}
                  </p>
                  <p className="text-sm text-slate-500">{cleaner.MobilePhone || 'No phone'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Jobs Overview</h2>
          <div className="space-y-3">
            {todayRecords.slice(0, 5).map((record) => (
              <div key={record.ServiceRecordID} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <div>
                  <p className="font-medium text-slate-900">{record.AddressLine || 'Service Job'}</p>
                  <p className="text-sm text-slate-500">{record.City}</p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                  record.Status === 'Created' ? 'bg-blue-100 text-blue-700' :
                  record.Status === 'In Cleaning' ? 'bg-amber-100 text-amber-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {record.Status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
