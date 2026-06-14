import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { customerService } from '../services/customerService';
import CustomerTable from '../components/CustomerTable';
import CustomerFilters from '../components/CustomerFilters';
import Pagination from '../../../components/common/Pagination';
import Modal from '../../../components/common/Modal';
import Button from '../../../components/common/Button';
import { useToast } from '../../../hooks/useToast';
import useAuth from '../../../hooks/useAuth';
import { ROLES } from '../../../utils/constants';

export const CustomerListPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { role: userRole } = useAuth();

  // List States
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // Filters State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('true'); // Default active

  // Sort State
  const [sortBy, setSortBy] = useState('SureName');
  const [sortOrder, setSortOrder] = useState('ASC');

  // Modal State
  const [activeModal, setActiveModal] = useState(null); // 'status' | 'delete' | null
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Fetch Logic
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const activeParam = statusFilter === 'all' ? null : statusFilter;
      const result = await customerService.getCustomers({
        page,
        limit,
        search,
        isActive: activeParam,
        sortBy,
        sortOrder
      });
      setCustomers(result.data || []);
      setTotal(result.pagination?.total || 0);
      setTotalPages(result.pagination?.totalPages || 0);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to fetch customers.', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter, sortBy, sortOrder, addToast]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Handlers
  const handleSort = (columnKey) => {
    if (sortBy === columnKey) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(columnKey);
      setSortOrder('ASC');
    }
    setPage(1);
  };

  const handleEdit = (customer) => {
    navigate(`/customers/${customer.CustomerID}/edit`);
  };

  const openStatusModal = (customer) => {
    setSelectedCustomer(customer);
    setActiveModal('status');
  };

  const handleToggleStatus = async () => {
    if (!selectedCustomer) return;
    setModalLoading(true);
    try {
      const newStatus = !selectedCustomer.IsActive;
      await customerService.toggleStatus(selectedCustomer.CustomerID, newStatus);
      addToast(
        `Customer "${selectedCustomer.FirstName} ${selectedCustomer.SureName}" has been successfully ${newStatus ? 'activated' : 'deactivated'}.`,
        'success'
      );
      setActiveModal(null);
      fetchCustomers();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update status.', 'error');
    } finally {
      setModalLoading(false);
      setSelectedCustomer(null);
    }
  };

  const openDeleteModal = (customer) => {
    setSelectedCustomer(customer);
    setActiveModal('delete');
  };

  const handleDelete = async () => {
    if (!selectedCustomer) return;
    setModalLoading(true);
    try {
      await customerService.deleteCustomer(selectedCustomer.CustomerID);
      addToast(`Customer "${selectedCustomer.FirstName} ${selectedCustomer.SureName}" has been soft-deleted.`, 'success');
      setActiveModal(null);
      fetchCustomers();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete customer.', 'error');
    } finally {
      setModalLoading(false);
      setSelectedCustomer(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Customers</h1>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mt-1">
            Manage cleaning service customers and rates
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate('/customers/new')}
          className="flex items-center gap-1.5 font-bold shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Customer</span>
        </Button>
      </div>

      {/* Filters */}
      <CustomerFilters
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        statusFilter={statusFilter}
        onStatusFilterChange={(val) => {
          setStatusFilter(val);
          setPage(1);
        }}
      />

      {/* Table grid */}
      {loading ? (
        <CustomerTable isLoading={true} columns={[]} />
      ) : customers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-16 text-center">
          <svg className="w-16 h-16 mx-auto text-slate-350 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="text-base font-bold text-slate-800">No Customers Found</h3>
          <p className="text-slate-450 text-xs mt-1 max-w-xs mx-auto">
            Try adjusting your search filters or add a new customer record.
          </p>
        </div>
      ) : (
        <>
          <CustomerTable
            customers={customers}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            onEdit={handleEdit}
            onToggleStatus={openStatusModal}
            onDelete={openDeleteModal}
            isLoading={false}
          />

          <Pagination
            page={page}
            totalPages={totalPages}
            limit={limit}
            total={total}
            onPageChange={(p) => setPage(p)}
          />
        </>
      )}

      {/* Confirmation Modals */}
      <Modal
        isOpen={activeModal === 'status'}
        onClose={() => setActiveModal(null)}
        title={selectedCustomer?.IsActive ? 'Deactivate Customer' : 'Activate Customer'}
        onConfirm={handleToggleStatus}
        confirmText={selectedCustomer?.IsActive ? 'Deactivate' : 'Activate'}
        confirmVariant={selectedCustomer?.IsActive ? 'danger' : 'primary'}
        isLoading={modalLoading}
      >
        <p>
          Are you sure you want to {selectedCustomer?.IsActive ? 'deactivate' : 'activate'} the customer{' '}
          <strong>
            {selectedCustomer?.FirstName} {selectedCustomer?.SureName}
          </strong>
          ?
        </p>
        <p className="mt-2 text-xs text-slate-450">
          This will also {selectedCustomer?.IsActive ? 'block' : 'allow'} their user credentials for login access.
        </p>
      </Modal>

      <Modal
        isOpen={activeModal === 'delete'}
        onClose={() => setActiveModal(null)}
        title="Delete Customer"
        onConfirm={handleDelete}
        confirmText="Delete"
        confirmVariant="danger"
        isLoading={modalLoading}
      >
        <p>
          Are you sure you want to delete{' '}
          <strong>
            {selectedCustomer?.FirstName} {selectedCustomer?.SureName}
          </strong>
          ?
        </p>
        <p className="mt-2 text-xs text-slate-450">
          This is a soft-delete action. Their status will be set to inactive in the database, and their user credentials will be disabled.
        </p>
      </Modal>
    </div>
  );
};

export default CustomerListPage;
