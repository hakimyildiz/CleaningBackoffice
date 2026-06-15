import React, { useState, useEffect } from 'react';
import customerPortalService from '../services/customerPortalService';
import CustomerServiceCard from '../components/CustomerServiceCard';
import { useToast } from '../../../hooks/useToast';
import { Sparkles } from 'lucide-react';

export const CustomerServicesPage = () => {
  const { addToast } = useToast();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const result = await customerPortalService.getServices();
        setServices(result.data);
      } catch (err) {
        addToast('Failed to load properties list.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-accent border-r-2" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="border-b border-slate-200/80 pb-4">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-indigo-500" />
          <span>My Properties</span>
        </h1>
        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5">
          View details and schedules of all properties under service
        </p>
      </div>

      {services.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 font-semibold text-xs italic">
          No registered properties found for your account.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {services.map((service) => (
            <CustomerServiceCard key={service.ServiceID} service={service} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerServicesPage;
