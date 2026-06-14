import React, { useState, useEffect, useCallback } from 'react';
import { userService } from '../services/userService';
import UserTable from '../components/UserTable';
import Pagination from '../../../components/common/Pagination';
import Modal from '../../../components/common/Modal';
import { useToast } from '../../../hooks/useToast';
import { KeyRound } from 'lucide-react';

export const UserListPage = () => {
  const { addToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const [activeModal, setActiveModal] = useState(null); // 'status' | 'reset' | 'reset_success' | null
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [newTempPassword, setNewTempPassword] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await userService.getUsers({ page, limit });
      setUsers(result.data || []);
      setTotal(result.pagination?.total || 0);
      setTotalPages(result.pagination?.totalPages || 0);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to fetch users.', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, limit, addToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openStatusModal = (user) => {
    setSelectedUser(user);
    setActiveModal('status');
  };

  const handleToggleStatus = async () => {
    if (!selectedUser) return;
    setModalLoading(true);
    try {
      const newStatus = !selectedUser.IsActive;
      await userService.toggleStatus(selectedUser.UserID, newStatus);
      addToast(
        `User "${selectedUser.Username}" status has been successfully updated.`,
        'success'
      );
      setActiveModal(null);
      fetchUsers();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update user status.', 'error');
    } finally {
      setModalLoading(false);
      setSelectedUser(null);
    }
  };

  const openResetModal = (user) => {
    setSelectedUser(user);
    setActiveModal('reset');
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;
    setModalLoading(true);
    try {
      const result = await userService.resetPassword(selectedUser.UserID);
      setNewTempPassword(result.data.tempPassword);
      if (result.warning) {
        addToast(result.warning, 'info');
      } else {
        addToast(`Password reset successfully and email notification queued.`, 'success');
      }
      setActiveModal('reset_success');
      fetchUsers();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to reset password.', 'error');
      setActiveModal(null);
      setSelectedUser(null);
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">System Users</h1>
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mt-1">
          Admin list of all registered portal user accounts
        </p>
      </div>

      {loading ? (
        <UserTable isLoading={true} />
      ) : (
        <>
          <UserTable
            users={users}
            onToggleStatus={openStatusModal}
            onResetPassword={openResetModal}
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

      {/* Status Modal */}
      <Modal
        isOpen={activeModal === 'status'}
        onClose={() => {
          setActiveModal(null);
          setSelectedUser(null);
        }}
        title={selectedUser?.IsActive ? 'Deactivate User Account' : 'Activate User Account'}
        onConfirm={handleToggleStatus}
        confirmText={selectedUser?.IsActive ? 'Deactivate' : 'Activate'}
        confirmVariant={selectedUser?.IsActive ? 'danger' : 'primary'}
        isLoading={modalLoading}
      >
        <p>
          Are you sure you want to {selectedUser?.IsActive ? 'deactivate' : 'activate'} user{' '}
          <strong>{selectedUser?.Username}</strong> ({selectedUser?.FirstName} {selectedUser?.SureName})?
        </p>
        <p className="mt-2 text-xs text-slate-450">
          {selectedUser?.IsActive 
            ? 'They will no longer be able to log in to the portal.' 
            : 'They will be allowed access to login features again.'}
        </p>
      </Modal>

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={activeModal === 'reset'}
        onClose={() => {
          setActiveModal(null);
          setSelectedUser(null);
        }}
        title="Reset User Password"
        onConfirm={handleResetPassword}
        confirmText="Reset Password"
        confirmVariant="danger"
        isLoading={modalLoading}
      >
        <p>
          Are you sure you want to reset the password for user <strong>{selectedUser?.Username}</strong>?
        </p>
        <p className="mt-2 text-xs text-slate-450">
          This will generate a new random temporary password, update the database, and attempt to email it to them immediately.
        </p>
      </Modal>

      {/* Reset Success Modal */}
      <Modal
        isOpen={activeModal === 'reset_success'}
        onClose={() => {
          setActiveModal(null);
          setSelectedUser(null);
          setNewTempPassword('');
        }}
        title="Password Reset Completed"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-emerald-600">
            <KeyRound className="w-5 h-5" />
            <span className="font-bold text-sm">Temporary Password Generated</span>
          </div>
          <p className="text-slate-600 text-sm">
            A temporary password has been successfully saved for user <strong>{selectedUser?.Username}</strong>:
          </p>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
            <code className="text-lg font-bold text-brand-primary tracking-wide select-all bg-white px-3 py-1.5 border border-slate-100 rounded-md">
              {newTempPassword}
            </code>
          </div>
          <p className="text-xs text-slate-450 leading-relaxed">
            Make sure to copy or write down this password. It has also been queued for delivery to the user's registered email address.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default UserListPage;
