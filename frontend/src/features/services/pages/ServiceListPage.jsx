import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { serviceService } from '../services/serviceService';
import ServiceTable from '../components/ServiceTable';
import ServiceFilters from '../components/ServiceFilters';
import Pagination from '../../../components/common/Pagination';
import Modal from '../../../components/common/Modal';
import Button from '../../../components/common/Button';
import { useToast } from '../../../hooks/useToast';
import { Plus, AlertTriangle, CalendarRange } from 'lucide-react';
import { formatDate } from '../../../utils/formatters';

export const ServiceListPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filters State
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    isActive: 'true', // Default to true matching spec
    showPauseRequests: false
  });
  const [sortBy, setSortBy] = useState('RefNo');
  const [sortOrder, setSortOrder] = useState('ASC');

  // Modal State
  const [selectedService, setSelectedService] = useState(null);
  const [pendingPause, setPendingPause] = useState(null);
  const [isPauseResolveOpen, setIsPauseResolveOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const activeParam = filters.isActive === 'all' ? undefined : (filters.isActive === 'true');
      const statusParam = filters.showPauseRequests ? 'pause_requested' : (filters.status || undefined);

      const result = await serviceService.getServices({
        page,
        limit,
        search,
        type: filters.type || undefined,
        status: statusParam,
        isActive: activeParam,
        sortBy,
        sortOrder
      });
      setServices(result.data || []);
      setTotal(result.pagination?.total || 0);
      setTotalPages(result.pagination?.totalPages || 0);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to load services list.', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, filters, sortBy, sortOrder, addToast]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleSearch = (query) => {
    setSearch(query);
    setPage(1);
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(1);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'));
    } else {
      setSortBy(field);
      setSortOrder('ASC');
    }
    setPage(1);
  };

  const handleEdit = (service) => {
    navigate(`/services/${service.ServiceID}/edit`);
  };

  const handleOpenDelete = (service) => {
    setSelectedService(service);
    setIsDeleteOpen(true);
  };

  const handleSoftDelete = async () => {
    if (!selectedService) return;
    setModalLoading(true);
    try {
      await serviceService.deleteService(selectedService.ServiceID);
      addToast(`Service "${selectedService.RefNo || 'No Ref'}" deleted successfully.`, 'success');
      setIsDeleteOpen(false);
      fetchServices();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to soft delete service.', 'error');
    } finally {
      setModalLoading(false);
      setSelectedService(null);
    }
  };

  const handleOpenPauseResolve = async (service) => {
    setSelectedService(service);
    setModalLoading(true);
    setIsPauseResolveOpen(true);
    try {
      const pausesResult = await serviceService.getPauses();
      const match = (pausesResult.data || []).find(
        (p) => p.ServiceID === service.ServiceID && p.Status === 'pending'
      );
      if (match) {
        setPendingPause(match);
      } else {
        addToast('No active pending pause request found for this service.', 'error');
        setIsPauseResolveOpen(false);
      }
    } catch (err) {
      addToast('Failed to load pending pause details.', 'error');
      setIsPauseResolveOpen(false);
    } finally {
      setModalLoading(false);
    }
  };

  const handleApprovePause = async () => {
    if (!pendingPause) return;
    setModalLoading(true);
    try {
      await serviceService.approvePause(pendingPause.ServicePauseID);
      addToast('Pause request approved successfully. Future appointments cancelled.', 'success');
      setIsPauseResolveOpen(false);
      fetchServices();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to approve pause.', 'error');
    } finally {
      setModalLoading(false);
      setPendingPause(null);
      setSelectedService(null);
    }
  };

  const handleRejectPause = async () => {
    if (!pendingPause) return;
    setModalLoading(true);
    try {
      await serviceService.rejectPause(pendingPause.ServicePauseID);
      addToast('Pause request rejected.', 'success');
      setIsPauseResolveOpen(false);
      fetchServices();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to reject pause.', 'error');
    } finally {
      setModalLoading(false);
      setPendingPause(null);
      setSelectedService(null);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Services Management</h1>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mt-1">
            Configure, pause, and search cleaner appointments and service rules
          </p>
        </div>
        <Button
          onClick={() => navigate('/services/new')}
          variant="primary"
          className="font-bold flex items-center gap-1.5 self-start sm:self-auto shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Service</span>
        </Button>
      </div>

      {/* Filters */}
      <ServiceFilters
        onSearch={handleSearch}
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      {/* Main Table */}
      <ServiceTable
        services={services}
        isLoading={loading}
        onEdit={handleEdit}
        onDelete={handleOpenDelete}
        onOpenPauseModal={handleOpenPauseResolve}
      />

      {/* Pagination */}
      {!loading && total > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          limit={limit}
          total={total}
          onPageChange={(p) => setPage(p)}
        />
      )}

      {/* Soft Delete Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Service"
        onConfirm={handleSoftDelete}
        confirmText="Soft Delete"
        confirmVariant="danger"
        isLoading={modalLoading}
      >
        <p>
          Are you sure you want to delete service <strong>{selectedService?.RefNo || 'selected service'}</strong>?
        </p>
        <p className="mt-2 text-xs text-slate-450">
          This is a soft-delete operation. The service rules will be deactivated, and all future scheduled appointments will be cancelled.
        </p>
      </Modal>

      {/* Resolve Pause Request Modal */}
      <Modal
        isOpen={isPauseResolveOpen}
        onClose={() => {
          setIsPauseResolveOpen(false);
          setPendingPause(null);
          setSelectedService(null);
        }}
        title="Resolve Customer Pause Request"
        isLoading={modalLoading}
      >
        {pendingPause ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-orange-600 bg-orange-50 border border-orange-100 p-3 rounded-xl">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <div className="text-xs font-semibold leading-snug">
                The customer has requested to pause this service.
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CalendarRange className="w-4 h-4 text-slate-450" />
                <span className="text-xs font-bold text-slate-450 uppercase tracking-wider">Requested Dates:</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                <span className="font-bold text-slate-800 text-sm">
                  {formatDate(pendingPause.PauseFrom)} — {formatDate(pendingPause.PauseTo)}
                </span>
              </div>
            </div>

            {pendingPause.Reason && (
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-450 uppercase tracking-wider">Reason provided:</span>
                <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 font-medium italic">
                  "{pendingPause.Reason}"
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={handleRejectPause}
                className="flex-1 font-bold text-red-500 border-red-200 hover:bg-red-50"
                disabled={modalLoading}
              >
                Reject Request
              </Button>
              <Button
                variant="primary"
                onClick={handleApprovePause}
                className="flex-1 font-bold bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
                disabled={modalLoading}
              >
                Approve & Pause
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-brand-accent" />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ServiceListPage;
