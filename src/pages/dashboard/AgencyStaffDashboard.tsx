"use client";
import { useState, useEffect } from 'react';
import { serviceRecordsApi, type ServiceRecord } from '../../lib/api';
import { LuBuilding as Building, LuClock as Clock, LuCircleCheck as CheckCircle, LuCircleAlert as AlertCircle, LuCalendar as Calendar } from 'react-icons/lu';

export function AgencyStaffDashboard() {
  const [properties, setProperties] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      const records = await serviceRecordsApi.getAll();
      const upcoming = records.filter(
        (r) => r.RecordDate >= today && r.RecordDate <= nextWeek.toISOString().split('T')[0]
      );
      setProperties(upcoming);
    } catch (err) {
      console.error('Error fetching properties:', err);
    } finally {
      setLoading(false);
    }
  };

  const inProgress = properties.filter((p) => p.Status === 'In Cleaning').length;
  const completed = properties.filter((p) => p.Status === 'Cleaned' || p.Status === 'Invoice Sent').length;
  const pending = properties.filter((p) => p.Status === 'Created').length;

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
        <h1 className="text-xl font-bold text-slate-900">Property Status</h1>
        <p className="text-slate-500 text-sm mt-1">View and manage assigned properties</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
          <div className="h-10 w-10 mx-auto rounded-full bg-amber-100 flex items-center justify-center mb-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
          </div>
          <p className="text-xl font-bold text-slate-900">{pending}</p>
          <p className="text-xs text-slate-500">Pending</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
          <div className="h-10 w-10 mx-auto rounded-full bg-blue-100 flex items-center justify-center mb-2">
            <Clock className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-xl font-bold text-slate-900">{inProgress}</p>
          <p className="text-xs text-slate-500">In Progress</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
          <div className="h-10 w-10 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-xl font-bold text-slate-900">{completed}</p>
          <p className="text-xs text-slate-500">Completed</p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="font-semibold text-slate-900">Upcoming Cleanings</h2>
        {properties.length === 0 ? (
          <div className="text-center py-8 text-slate-500 bg-white rounded-2xl">
            <Building className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p>No properties scheduled</p>
          </div>
        ) : (
          properties.map((prop) => (
            <div
              key={prop.ServiceRecordID}
              className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-slate-900">{prop.AddressLine}</p>
                  <p className="text-sm text-slate-500">{prop.City}, {prop.PostCode}</p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                  prop.Status === 'Created' ? 'bg-blue-100 text-blue-700' :
                  prop.Status === 'In Cleaning' ? 'bg-amber-100 text-amber-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {prop.Status}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {new Date(prop.RecordDate).toLocaleDateString('en-GB', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </div>
                <button className="text-blue-600 hover:text-blue-700 font-medium">
                  Set Arrival
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
