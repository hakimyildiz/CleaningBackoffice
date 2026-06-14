"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { serviceRecordsApi, type ServiceRecord } from '../../lib/api';
import { LuClock as Clock, LuCamera as Camera, LuCircleCheck as CheckCircle, LuPlay as Play, LuSquare as Square, LuCalendar as Calendar, LuMapPin as MapPin } from 'react-icons/lu';

export function CleanerDashboard() {
  const { user, entityId } = useAuth();
  const [todayJobs, setTodayJobs] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [clockedIn, setClockedIn] = useState(false);
  const [activeJob, setActiveJob] = useState<ServiceRecord | null>(null);

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

  const handleClockIn = (job: ServiceRecord) => {
    setActiveJob(job);
    setClockedIn(true);
  };

  const handleClockOut = async () => {
    if (activeJob && entityId) {
      try {
        await serviceRecordsApi.clockOut(activeJob.ServiceRecordID, entityId, 60, []);
        fetchTodayJobs();
      } catch (err) {
        console.error('Error clocking out:', err);
      }
    }
    setClockedIn(false);
    setActiveJob(null);
  };

  const pendingJobs = todayJobs.filter((j) => j.Status === 'Created');
  const completedJobs = todayJobs.filter((j) => j.Status === 'Cleaned' || j.Status === 'Invoice Sent');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-20">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">My Schedule</h1>
        <p className="text-slate-500 text-sm mt-1">
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {clockedIn && activeJob && (
        <div className="bg-blue-600 text-white rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 bg-white rounded-full animate-pulse" />
              <span className="font-medium">Currently Working</span>
            </div>
            <Clock className="h-5 w-5" />
          </div>
          <p className="font-semibold text-lg">{activeJob.AddressLine}</p>
          <p className="text-blue-100 text-sm">{activeJob.City}, {activeJob.PostCode}</p>
          <button
            onClick={handleClockOut}
            className="w-full mt-4 py-3 bg-white text-blue-600 font-semibold rounded-xl flex items-center justify-center gap-2"
          >
            <Square className="h-5 w-5" />
            Clock Out & Complete
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-amber-500" />
            <span className="text-sm text-slate-500">Pending</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{pendingJobs.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm text-slate-500">Completed</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{completedJobs.length}</p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="font-semibold text-slate-900">Today's Jobs</h2>
        {todayJobs.length === 0 ? (
          <div className="text-center py-8 text-slate-500 bg-white rounded-2xl">
            <Calendar className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p>No jobs scheduled for today</p>
          </div>
        ) : (
          todayJobs.map((job) => (
            <div
              key={job.ServiceRecordID}
              className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{job.AddressLine}</p>
                    <p className="text-sm text-slate-500">{job.City}, {job.PostCode}</p>
                  </div>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                  job.Status === 'Created' ? 'bg-blue-100 text-blue-700' :
                  job.Status === 'In Cleaning' ? 'bg-amber-100 text-amber-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {job.Status}
                </span>
              </div>
              <div className="flex gap-2 text-sm text-slate-600 mb-3">
                <span>{job.Beds} beds</span>
                <span className="text-slate-300">|</span>
                <span>{job.Bathroom} baths</span>
                {job.Pet && (
                  <>
                    <span className="text-slate-300">|</span>
                    <span className="text-amber-600">Has pets</span>
                  </>
                )}
              </div>
              {job.Status === 'Created' && !clockedIn && (
                <button
                  onClick={() => handleClockIn(job)}
                  className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-xl flex items-center justify-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  Clock In
                </button>
              )}
              {job.Status === 'In Cleaning' && (
                <button className="w-full py-2.5 bg-slate-100 text-slate-600 font-medium rounded-xl flex items-center justify-center gap-2">
                  <Camera className="h-4 w-4" />
                  Upload Photos
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
