import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { agencyStaffService } from '../services/agencyStaffService';
import AgencyStaffTable from '../components/AgencyStaffTable';
import AgencyStaffFilters from '../components/AgencyStaffFilters';
import Pagination from '../../../components/common/Pagination';
import Modal from '../../../components/common/Modal';
import Button from '../../../components/common/Button';
import { useToast } from '../../../hooks/useToast';
import useAuth from '../../../hooks/useAuth';
import { ROLES } from '../../../utils/constants';

export const AgencyStaffListPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { role: userRole } = useAuth();

  // List States
  const [staffList, setStaffList] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // Filters State
  const [search, setSearch] = useState('');
  const [agencyFilter, setAgencyFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('true'); // Default active

  // Sort State
  const [sortBy, setSortBy] = useState('SureName');
  const [sortOrder, setSortOrder] = useState('ASC');

  // Modal State
  const [activeModal, setActiveModal] = useState(null); // 'status' | 'delete' | null
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Fetch agencies for dropdown once on load
  useEffect(() => {
    const fetchAgencies = async () => {
      try {
        const result = await agencyStaffService.getAgencies();
        setAgencies(result.data || []);
      } catch (err) {
        console.error('Failed to load agencies:', err.message);
      }
    };
    fetchAgencies();
  }, []);

  // Fetch Logic
  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const activeParam = statusFilter === 'all' ? null : statusFilter;
      const result = await agencyStaffService.getAgencyStaff({
        page,
        limit,
        search,
        agencyId: agencyFilter || null,
        role: roleFilter || null,
        isActive: activeParam,
        sortBy,
        sortOrder
      });
      setStaffList(result.data || []);
      setTotal(result.pagination?.total || 0);
      setTotalPages(result.pagination?.totalPages || 0);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to fetch agency staff.', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, agencyFilter, roleFilter, statusFilter, sortBy, sortOrder, addToast]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

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

  const handleEdit = (staff) => {
    navigate(`/agency-staff/${staff.AgencyStaffID}/edit`);
  };

  const openStatusModal = (staff) => {
    setSelectedStaff(staff);
    setActiveModal('status');
  };

  const handleToggleStatus = async () => {
    if (!selectedStaff) return;
    setModalLoading(true);
    try {
      const newStatus = !selectedStaff.IsActive;
      await agencyStaffService.toggleStatus(selectedStaff.AgencyStaffID, newStatus);
      addToast(
        `Staff "${selectedStaff.FirstName} ${selectedStaff.SureName}" status has been successfully ${newStatus ? 'activated' : 'deactivated'}.`,
        'success'
      );
      setActiveModal(null);
      fetchStaff();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update status.', 'error');
    } finally {
      setModalLoading(false);
      setSelectedStaff(null);
    }
  };

  const openDeleteModal = (staff) => {
    setSelectedStaff(staff);
    setActiveModal('delete');
  };

  const handleDelete = async () => {
    if (!selectedStaff) return;
    setModalLoading(true);
    try {
      await agencyStaffService.deleteAgencyStaff(selectedStaff.AgencyStaffID);
      addToast(`Staff "${selectedStaff.FirstName} ${selectedStaff.SureName}" has been soft-deleted.`, 'success');
      setActiveModal(null);
      fetchStaff();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete agency staff.', 'error');
    } finally {
      setModalLoading(false);
      setSelectedStaff(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Agency Staff</h1>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mt-1">
            Manage agency coordinators, staff members, and bookkeepers
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate('/agency-staff/new')}
          className="flex items-center gap-1.5 font-bold shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Staff</span>
        </Button>
      </div>

      {/* Filters */}
      <AgencyStaffFilters
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        agencies={agencies}
        agencyFilter={agencyFilter}
        onAgencyFilterChange={(val) => {
          setAgencyFilter(val);
          setPage(1);
        }}
        roleFilter={roleFilter}
        onRoleFilterChange={(val) => {
          setRoleFilter(val);
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
        <AgencyStaffTable isLoading={true} columns={[]} />
      ) : staffList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-16 text-center">
          <svg className="w-16 h-16 mx-auto text-slate-350 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="text-base font-bold text-slate-800">No Agency Staff Found</h3>
          <p className="text-slate-450 text-xs mt-1 max-w-xs mx-auto">
            Try adjusting your search filters or add a new agency staff record.
          </p>
        </div>
      ) : (
        <>
          <AgencyStaffTable
            agencyStaff={staffList}
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
        title={selectedStaff?.IsActive ? 'Deactivate Staff' : 'Activate Staff'}
        onConfirm={handleToggleStatus}
        confirmText={selectedStaff?.IsActive ? 'Deactivate' : 'Activate'}
        confirmVariant={selectedStaff?.IsActive ? 'danger' : 'primary'}
        isLoading={modalLoading}
      >
        <p>
          Are you sure you want to {selectedStaff?.IsActive ? 'deactivate' : 'activate'} the staff member{' '}
          <strong>
            {selectedStaff?.FirstName} {selectedStaff?.SureName}
          </strong>
          ?
        </p>
        <p className="mt-2 text-xs text-slate-450">
          This will also {selectedStaff?.IsActive ? 'block' : 'allow'} their user credentials for login access.
        </p>
      </Modal>

      <Modal
        isOpen={activeModal === 'delete'}
        onClose={() => setActiveModal(null)}
        title="Delete Agency Staff"
        onConfirm={handleDelete}
        confirmText="Delete"
        confirmVariant="danger"
        isLoading={modalLoading}
      >
        <p>
          Are you sure you want to delete{' '}
          <strong>
            {selectedStaff?.FirstName} {selectedStaff?.SureName}
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

export default AgencyStaffListPage;
