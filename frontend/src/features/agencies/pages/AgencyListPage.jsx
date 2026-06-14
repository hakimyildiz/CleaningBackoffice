import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { agencyService } from '../services/agencyService';
import AgencyTable from '../components/AgencyTable';
import AgencyFilters from '../components/AgencyFilters';
import Pagination from '../../../components/common/Pagination';
import Modal from '../../../components/common/Modal';
import Button from '../../../components/common/Button';
import { useToast } from '../../../hooks/useToast';
import { Plus } from 'lucide-react';

export const AgencyListPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filters State
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [search, setSearch] = useState('');
  const [isActive, setIsActive] = useState('all'); // 'all' | 'true' | 'false'
  const [sortBy, setSortBy] = useState('Name');
  const [sortOrder, setSortOrder] = useState('ASC');

  // Confirmation Modals State
  const [selectedAgency, setSelectedAgency] = useState(null);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchAgencies = useCallback(async () => {
    setLoading(true);
    try {
      const activeParam = isActive === 'all' ? undefined : isActive;
      const result = await agencyService.getAgencies({
        page,
        limit,
        search,
        isActive: activeParam,
        sortBy,
        sortOrder
      });
      setAgencies(result.data || []);
      setTotal(result.pagination?.total || 0);
      setTotalPages(result.pagination?.totalPages || 0);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to load agencies list.', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, isActive, sortBy, sortOrder, addToast]);

  useEffect(() => {
    fetchAgencies();
  }, [fetchAgencies]);

  const handleSearch = (query) => {
    setSearch(query);
    setPage(1);
  };

  const handleStatusFilter = (e) => {
    setIsActive(e.target.value);
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

  const handleEdit = (agency) => {
    navigate(`/agencies/${agency.AgencyID}/edit`);
  };

  const handleOpenStatusModal = (agency) => {
    setSelectedAgency(agency);
    setIsStatusOpen(true);
  };

  const handleToggleStatus = async () => {
    if (!selectedAgency) return;
    setModalLoading(true);
    try {
      const nextStatus = !(selectedAgency.IsActive === 1 || selectedAgency.IsActive === true);
      await agencyService.toggleStatus(selectedAgency.AgencyID, nextStatus);
      addToast(
        `Agency "${selectedAgency.Name}" status has been successfully updated.`,
        'success'
      );
      setIsStatusOpen(false);
      fetchAgencies();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update agency status.', 'error');
    } finally {
      setModalLoading(false);
      setSelectedAgency(null);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Cleaning Agencies</h1>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mt-1">
            Manage corporate agency accounts and primary contacts
          </p>
        </div>
        <Button
          onClick={() => navigate('/agencies/new')}
          variant="primary"
          className="font-bold flex items-center gap-1.5 self-start sm:self-auto shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Agency</span>
        </Button>
      </div>

      {/* Filters */}
      <AgencyFilters
        onSearch={handleSearch}
        status={isActive}
        onStatusChange={handleStatusFilter}
      />

      {/* Table */}
      <AgencyTable
        agencies={agencies}
        isLoading={loading}
        onEdit={handleEdit}
        onToggleStatus={handleOpenStatusModal}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
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

      {/* Deactivate/Activate Confirmation Modal */}
      <Modal
        isOpen={isStatusOpen}
        onClose={() => setIsStatusOpen(false)}
        title={selectedAgency?.IsActive === 1 || selectedAgency?.IsActive === true ? 'Deactivate Agency Account' : 'Activate Agency Account'}
        onConfirm={handleToggleStatus}
        confirmText={selectedAgency?.IsActive === 1 || selectedAgency?.IsActive === true ? 'Deactivate' : 'Activate'}
        confirmVariant={selectedAgency?.IsActive === 1 || selectedAgency?.IsActive === true ? 'danger' : 'primary'}
        isLoading={modalLoading}
      >
        <p>
          Are you sure you want to {selectedAgency?.IsActive === 1 || selectedAgency?.IsActive === true ? 'deactivate' : 'activate'}{' '}
          agency account <strong>{selectedAgency?.Name}</strong>?
        </p>
        <p className="mt-2 text-xs text-slate-450">
          {selectedAgency?.IsActive === 1 || selectedAgency?.IsActive === true
            ? 'Any linked agency staff logins will remain active, but general portal actions might be restricted.'
            : 'Access privileges will be restored.'}
        </p>
      </Modal>
    </div>
  );
};

export default AgencyListPage;
