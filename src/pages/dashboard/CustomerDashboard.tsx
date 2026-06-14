import { useState, useEffect } from 'react';
import { serviceRecordsApi, invoicesApi, type ServiceRecord, type Invoice } from '../../lib/api';
import {
  Calendar,
  FileText,
  CreditCard,
  Clock,
  Plus,
  Home,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

export function CustomerDashboard() {
  const [upcomingServices, setUpcomingServices] = useState<ServiceRecord[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      const [servicesData, invoicesData] = await Promise.all([
        serviceRecordsApi.getAll(),
        invoicesApi.getAll(),
      ]);

      const upcoming = servicesData.filter(s => s.RecordDate >= today && s.RecordDate <= nextWeek.toISOString().split('T')[0]);
      setUpcomingServices(upcoming);
      setInvoices(invoicesData);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const unpaidInvoices = invoices.filter((i) => i.Status === 'Sent');
  const paidInvoices = invoices.filter((i) => i.Status === 'Paid');

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
        <h1 className="text-xl font-bold text-slate-900">My Account</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your cleaning services</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <button className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col items-center gap-2">
          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
            <Plus className="h-6 w-6 text-blue-600" />
          </div>
          <span className="text-sm font-medium text-slate-700">Request Extra</span>
        </button>
        <button className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col items-center gap-2">
          <div className="h-12 w-12 rounded-full bg-violet-100 flex items-center justify-center">
            <Clock className="h-6 w-6 text-violet-600" />
          </div>
          <span className="text-sm font-medium text-slate-700">Reschedule</span>
        </button>
      </div>

      {unpaidInvoices.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800">Outstanding Invoices</p>
              <p className="text-sm text-amber-600">You have {unpaidInvoices.length} unpaid invoice(s)</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">Upcoming Services</h2>
          <Calendar className="h-5 w-5 text-slate-400" />
        </div>
        {upcomingServices.length === 0 ? (
          <div className="text-center py-6 text-slate-500">
            <Home className="h-10 w-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm">No upcoming services scheduled</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingServices.map((service) => (
              <div
                key={service.ServiceRecordID}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {new Date(service.RecordDate).toLocaleDateString('en-GB', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                  <p className="text-sm text-slate-500">{service.AddressLine}</p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                  service.Status === 'Created' ? 'bg-blue-100 text-blue-700' :
                  service.Status === 'In Cleaning' ? 'bg-amber-100 text-amber-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {service.Status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">My Invoices</h2>
          <FileText className="h-5 w-5 text-slate-400" />
        </div>
        {invoices.length === 0 ? (
          <div className="text-center py-6 text-slate-500">
            <CreditCard className="h-10 w-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm">No invoices yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <div
                key={invoice.InvoiceID}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50"
              >
                <div>
                  <p className="font-medium text-slate-900">{invoice.InvoiceNumber}</p>
                  <p className="text-sm text-slate-500">
                    {new Date(invoice.CreatedAt).toLocaleDateString('en-GB')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-900">
                    {invoice.Total?.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' })}
                  </p>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    invoice.Status === 'Sent' ? 'bg-amber-100 text-amber-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {invoice.Status === 'Sent' ? 'Unpaid' : 'Paid'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
