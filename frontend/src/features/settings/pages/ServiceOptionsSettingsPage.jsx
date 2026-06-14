import React, { useState, useEffect, useCallback } from 'react';
import { serviceOptionService } from '../services/serviceOptionService';
import ServiceOptionTable from '../components/ServiceOptionTable';
import ServiceOptionFormModal from '../components/ServiceOptionFormModal';
import SearchBar from '../../../components/common/SearchBar';
import Pagination from '../../../components/common/Pagination';
import Modal from '../../../components/common/Modal';
import Button from '../../../components/common/Button';
import { useToast } from '../../../hooks/useToast';
import { Plus, SlidersHorizontal } from 'lucide-react';

export const ServiceOptionsSettingsPage = () => {
  const { addToast } = useToast();
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Query Filters State
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [search, setSearch] = useState('');
  const [isActive, setIsActive] = useState('all'); // 'all' | 'true' | 'false'
  const [sortBy, setSortBy] = useState('Name');
  const [sortOrder, setSortOrder] = useState('ASC');

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchOptions = useCallback(async () => {
    setLoading(true);
    try {
      const activeParam = isActive === 'all' ? undefined : isActive;
      const result = await serviceOptionService.getAllServiceOptions({
        page,
        limit,
        search,
        isActive: activeParam,
        sortBy,
        sortOrder
      });
      setOptions(result.data || []);
      setTotal(result.pagination?.total || 0);
      setTotalPages(result.pagination?.totalPages || 0);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to load service options.', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, isActive, sortBy, sortOrder, addToast]);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  const handleSearch = (query) => {
    setSearch(query);
    setPage(1);
  };

  const handleStatusFilterChange = (e) => {
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

  const handleOpenCreate = () => {
    setSelectedOption(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (option) => {
    setSelectedOption(option);
    setIsFormOpen(true);
  };

  const handleOpenStatus = (option) => {
    setSelectedOption(option);
    setIsStatusOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    setModalLoading(true);
    try {
      if (selectedOption) {
        await serviceOptionService.updateServiceOption(selectedOption.ServiceOptionID, formData);
        addToast(`Option "${formData.Name}" updated successfully.`, 'success');
      } else {
        await serviceOptionService.createServiceOption(formData);
        addToast(`Option "${formData.Name}" created successfully.`, 'success');
      }
      setIsFormOpen(false);
      fetchOptions();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save service option.', 'error');
      throw err; // FormModal will handle internal fields validation errors mapping
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedOption) return;
    setModalLoading(true);
    try {
      const nextStatus = !(selectedOption.IsActive === 1 || selectedOption.IsActive === true);
      await serviceOptionService.toggleStatus(selectedOption.ServiceOptionID, nextStatus);
      addToast(
        `Option "${selectedOption.Name}" status updated successfully.`,
        'success'
      );
      setIsStatusOpen(false);
      fetchOptions();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to toggle status.', 'error');
    } finally {
      setModalLoading(false);
      setSelectedOption(null);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Service Options</h1>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mt-1">
            Configure system-wide add-ons and chargeable service tasks
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          variant="primary"
          className="font-bold flex items-center gap-1.5 self-start sm:self-auto shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Option</span>
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="w-full md:w-72">
          <SearchBar onSearch={handleSearch} placeholder="Search options..." />
        </div>

        <div className="flex items-center gap-2 ml-auto w-full md:w-auto">
          <SlidersHorizontal className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status:</span>
          <select
            value={isActive}
            onChange={handleStatusFilterChange}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-colors"
          >
            <option value="all">All Options</option>
            <option value="true">Active Only</option>
            <option value="false">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <ServiceOptionTable
        options={options}
        isLoading={loading}
        onEdit={handleOpenEdit}
        onToggleStatus={handleOpenStatus}
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

      {/* Form Dialog Modal */}
      <ServiceOptionFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        option={selectedOption}
        isLoading={modalLoading}
      />

      {/* Status Confirm Modal */}
      <Modal
        isOpen={isStatusOpen}
        onClose={() => setIsStatusOpen(false)}
        title={selectedOption?.IsActive === 1 || selectedOption?.IsActive === true ? 'Deactivate Option' : 'Activate Option'}
        onConfirm={handleToggleStatus}
        confirmText={selectedOption?.IsActive === 1 || selectedOption?.IsActive === true ? 'Deactivate' : 'Activate'}
        confirmVariant={selectedOption?.IsActive === 1 || selectedOption?.IsActive === true ? 'danger' : 'primary'}
        isLoading={modalLoading}
      >
        <p>
          Are you sure you want to {selectedOption?.IsActive === 1 || selectedOption?.IsActive === true ? 'deactivate' : 'activate'}{' '}
          the option <strong>{selectedOption?.Name}</strong>?
        </p>
        <p className="mt-2 text-xs text-slate-450">
          {selectedOption?.IsActive === 1 || selectedOption?.IsActive === true
            ? 'It will no longer be select-able on new service configurations.'
            : 'It will become available for assignment to service schedules again.'}
        </p>
      </Modal>
    </div>
  );
};

export default ServiceOptionsSettingsPage;
