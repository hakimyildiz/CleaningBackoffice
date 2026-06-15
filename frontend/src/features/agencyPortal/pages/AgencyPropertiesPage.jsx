import React, { useState, useEffect } from 'react';
import useAuth from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/useToast';
import agencyPortalService from '../services/agencyPortalService';
import AgencyPropertyCard from '../components/AgencyPropertyCard';
import AgencyRequestFormModal from '../components/AgencyRequestFormModal';
import { Building2, Search } from 'lucide-react';

export const AgencyPropertiesPage = () => {
  const { role } = useAuth();
  const { addToast } = useToast();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Request Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchProperties = async () => {
    try {
      const result = await agencyPortalService.getProperties();
      setProperties(result.data || []);
    } catch (err) {
      addToast('Failed to load properties list.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [addToast]);

  const handleRequestChangeClick = (property) => {
    setSelectedProperty(property);
    setModalOpen(true);
  };

  const handleRequestSubmit = async (requestData) => {
    setModalLoading(true);
    try {
      await agencyPortalService.submitRequest(requestData);
      addToast('Your change request has been submitted successfully.', 'success');
      setModalOpen(false);
    } catch (err) {
      addToast(err.response?.data?.message || err.message || 'Failed to submit request.', 'error');
    } finally {
      setModalLoading(false);
    }
  };

  const filteredProperties = properties.filter((p) => {
    const address = p.AddressLine?.toLowerCase() || '';
    const city = p.City?.toLowerCase() || '';
    const client = `${p.CustomerFirstName || ''} ${p.CustomerSureName || ''}`.toLowerCase();
    const query = searchTerm.toLowerCase();
    return address.includes(query) || city.includes(query) || client.includes(query);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-accent border-r-2" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left max-w-4xl mx-auto">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/80 pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-brand-accent" />
            <span>Properties</span>
          </h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5">
            {role === 'agency_staff' 
              ? 'View and manage properties assigned to you'
              : 'Browse and monitor properties across the agency'}
          </p>
        </div>

        {/* Search Input */}
        <div className="relative shrink-0 max-w-xs w-full">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search address or client..."
            className="w-full bg-slate-100 hover:bg-slate-150 border border-slate-200 rounded-2xl py-2 pl-9 pr-4 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-brand-accent focus:bg-white transition-all shadow-2xs"
          />
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
        </div>
      </div>

      {/* Properties List */}
      {filteredProperties.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 font-semibold text-xs italic shadow-xs">
          No properties matching search terms found.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProperties.map((prop) => (
            <AgencyPropertyCard
              key={prop.ServiceID}
              property={prop}
              role={role}
              onRequestChange={handleRequestChangeClick}
            />
          ))}
        </div>
      )}

      {/* Request Change Modal */}
      <AgencyRequestFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        selectedProperty={selectedProperty}
        onSubmit={handleRequestSubmit}
        loading={modalLoading}
      />
    </div>
  );
};

export default AgencyPropertiesPage;
