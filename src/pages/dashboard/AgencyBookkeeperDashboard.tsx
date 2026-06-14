import { useState, useEffect } from 'react';
import { invoicesApi, type Invoice } from '../../lib/api';
import { FileText, DollarSign, TrendingUp, CreditCard } from 'lucide-react';

export function AgencyBookkeeperDashboard() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const data = await invoicesApi.getAll();
      setInvoices(data || []);
    } catch (err) {
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const unpaidInvoices = invoices.filter((i) => i.Status === 'Sent');
  const paidInvoices = invoices.filter((i) => i.Status === 'Paid');
  const unpaidTotal = unpaidInvoices.reduce((sum, i) => sum + (i.Total || 0), 0);
  const paidTotal = paidInvoices.reduce((sum, i) => sum + (i.Total || 0), 0);

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
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Bookkeeper Dashboard</h1>
        <p className="text-slate-500 mt-1">Manage invoices and payments.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-amber-500 p-2 rounded-lg">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm text-slate-500">Unpaid Invoices</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{unpaidInvoices.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-red-500 p-2 rounded-lg">
              <DollarSign className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm text-slate-500">Outstanding</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {unpaidTotal.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' })}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-green-500 p-2 rounded-lg">
              <CreditCard className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm text-slate-500">Paid Invoices</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{paidInvoices.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-blue-500 p-2 rounded-lg">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm text-slate-500">Revenue</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {paidTotal.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' })}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">All Invoices</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Invoice #</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Date</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Amount</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.InvoiceID} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-3 px-4 font-medium text-slate-900">{inv.InvoiceNumber}</td>
                  <td className="py-3 px-4 text-slate-600">
                    {new Date(inv.CreatedAt).toLocaleDateString('en-GB')}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-900">
                    {inv.Total?.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' })}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                      inv.Status === 'Sent' ? 'bg-amber-100 text-amber-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {inv.Status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
