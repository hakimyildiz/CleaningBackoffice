import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ToggleLeft, ToggleRight, Sparkles } from 'lucide-react';
import { employeeService } from '../services/employeeService';
import EmployeeTable from '../components/EmployeeTable';
import EmployeeFilters from '../components/EmployeeFilters';
import Pagination from '../../../components/common/Pagination';
import Modal from '../../../components/common/Modal';
import Button from '../../../components/common/Button';
import { useToast } from '../../../hooks/useToast';
import useAuth from '../../../hooks/useAuth';
import { ROLES } from '../../../utils/constants';

export const EmployeeListPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { role: userRole } = useAuth();
  const isReadOnly = userRole === ROLES.CLEANER_MANAGER;

  // List States
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // Filters State
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('true'); // Default active

  // Sort State
  const [sortBy, setSortBy] = useState('SureName');
  const [sortOrder, setSortOrder] = useState('ASC');

  // Modal State
  const [activeModal, setActiveModal] = useState(null); // 'status' | 'delete' | null
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Fetch Logic
  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const activeParam = statusFilter === 'all' ? null : statusFilter;
      const result = await employeeService.getEmployees({
        page,
        limit,
        search,
        role: roleFilter || null,
        isActive: activeParam,
        sortBy,
        sortOrder
      });
      setEmployees(result.data || []);
      setTotal(result.pagination?.total || 0);
      setTotalPages(result.pagination?.totalPages || 0);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to fetch employees.', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, roleFilter, statusFilter, sortBy, sortOrder, addToast]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

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

  const handleEdit = (employee) => {
    navigate(`/employees/${employee.EmployeeID}/edit`);
  };

  const openStatusModal = (employee) => {
    setSelectedEmployee(employee);
    setActiveModal('status');
  };

  const handleToggleStatus = async () => {
    if (!selectedEmployee) return;
    setModalLoading(true);
    try {
      const newStatus = !selectedEmployee.IsActive;
      await employeeService.toggleStatus(selectedEmployee.EmployeeID, newStatus);
      addToast(
        `Employee "${selectedEmployee.FirstName} ${selectedEmployee.SureName}" has been successfully ${newStatus ? 'activated' : 'deactivated'}.`,
        'success'
      );
      setActiveModal(null);
      fetchEmployees();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update status.', 'error');
    } finally {
      setModalLoading(false);
      setSelectedEmployee(null);
    }
  };

  const openDeleteModal = (employee) => {
    setSelectedEmployee(employee);
    setActiveModal('delete');
  };

  const handleDelete = async () => {
    if (!selectedEmployee) return;
    setModalLoading(true);
    try {
      await employeeService.deleteEmployee(selectedEmployee.EmployeeID);
      addToast(`Employee "${selectedEmployee.FirstName} ${selectedEmployee.SureName}" has been soft-deleted.`, 'success');
      setActiveModal(null);
      fetchEmployees();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete employee.', 'error');
    } finally {
      setModalLoading(false);
      setSelectedEmployee(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Employees</h1>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mt-1">
            Manage cleaning crew and office managers
          </p>
        </div>
        {!isReadOnly && (
          <Button
            variant="primary"
            onClick={() => navigate('/employees/new')}
            className="flex items-center gap-1.5 font-bold shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Employee</span>
          </Button>
        )}
      </div>

      {/* Filters */}
      <EmployeeFilters
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
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
        <EmployeeTable isLoading={true} columns={[]} />
      ) : employees.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-16 text-center">
          <svg className="w-16 h-16 mx-auto text-slate-355 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="text-base font-bold text-slate-800">No Employees Found</h3>
          <p className="text-slate-450 text-xs mt-1 max-w-xs mx-auto">
            Try adjusting your search filters or add a new employee record.
          </p>
        </div>
      ) : (
        <>
          <EmployeeTable
            employees={employees}
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
        title={selectedEmployee?.IsActive ? 'Deactivate Employee' : 'Activate Employee'}
        onConfirm={handleToggleStatus}
        confirmText={selectedEmployee?.IsActive ? 'Deactivate' : 'Activate'}
        confirmVariant={selectedEmployee?.IsActive ? 'danger' : 'primary'}
        isLoading={modalLoading}
      >
        <p>
          Are you sure you want to {selectedEmployee?.IsActive ? 'deactivate' : 'activate'} the employee{' '}
          <strong>
            {selectedEmployee?.FirstName} {selectedEmployee?.SureName}
          </strong>
          ?
        </p>
        <p className="mt-2 text-xs text-slate-450">
          This will also {selectedEmployee?.IsActive ? 'block' : 'allow'} their user credentials for login access.
        </p>
      </Modal>

      <Modal
        isOpen={activeModal === 'delete'}
        onClose={() => setActiveModal(null)}
        title="Delete Employee"
        onConfirm={handleDelete}
        confirmText="Delete"
        confirmVariant="danger"
        isLoading={modalLoading}
      >
        <p>
          Are you sure you want to delete{' '}
          <strong>
            {selectedEmployee?.FirstName} {selectedEmployee?.SureName}
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

export default EmployeeListPage;
