import { useState, useEffect } from 'react';
import { serviceRecordsApi, invoicesApi, type ServiceRecord, type Invoice } from '../../lib/api';
import {
  Building,
  Calendar,
  FileText,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

export function AgencyManagerDashboard() {
  const [todayJobs, setTodayJobs] = useState<ServiceRecord[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [jobsData, invoicesData] = await Promise.all([
        serviceRecordsApi.getAll({ date: today }),
        invoicesApi.getAll(),
      ]);
      setTodayJobs(jobsData);
      setInvoices(invoicesData);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const unpaidTotal = invoices
    .filter((i) => i.Status === 'Sent')
    .reduce((sum, i) => sum + (i.Total || 0), 0);
  const paidTotal = invoices
    .filter((i) => i.Status === 'Paid')
    .reduce((sum, i) => sum + (i.Total || 0), 0);

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
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Agency Dashboard</h1>
        <p className="text-slate-500 mt-1">Manage properties, staff, and invoicing.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-blue-500 p-2 rounded-lg">
              <Calendar className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm text-slate-500">Today's Jobs</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{todayJobs.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-amber-500 p-2 rounded-lg">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm text-slate-500">Unpaid</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {unpaidTotal.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' })}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-green-500 p-2 rounded-lg">
              <DollarSign className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm text-slate-500">Paid</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {paidTotal.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' })}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-violet-500 p-2 rounded-lg">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm text-slate-500">Properties</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{todayJobs.length}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Today's Schedule</h2>
          {todayJobs.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Calendar className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>No jobs scheduled for today</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayJobs.map((job) => (
                <div key={job.ServiceRecordID} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                  <div>
                    <p className="font-medium text-slate-900">{job.AddressLine}</p>
                    <p className="text-sm text-slate-500">{job.City}</p>
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

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Invoices</h2>
          {invoices.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <FileText className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>No invoices yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.slice(0, 5).map((inv) => (
                <div key={inv.InvoiceID} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                  <div>
                    <p className="font-medium text-slate-900">{inv.InvoiceNumber}</p>
                    <p className="text-sm text-slate-500">
                      {new Date(inv.CreatedAt).toLocaleDateString('en-GB')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">
                      {inv.Total?.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' })}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      inv.Status === 'Sent' ? 'bg-amber-100 text-amber-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {inv.Status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
