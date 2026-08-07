import React, { useState, useEffect } from 'react';
import { FiTrash2, FiShield, FiUser } from 'react-icons/fi';
import { userService } from '../../services/userService';
import { useAuth } from '../../hooks/useAuth';
import StatusBadge from '../../components/common/StatusBadge';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { showToast } from '../../components/common/Toast';
import { formatDate } from '../../utils/formatters';

const ROLES = ['admin', 'teacher', 'student'];

const UsersPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await userService.getAll({
        page,
        limit: 10,
        role: selectedRole || undefined,
        search: search || undefined,
      });
      if (res.success) {
        setUsers(res.data || []);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
        }
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, selectedRole, search]);

  const handleDeleteClick = (u) => {
    if (u.id === currentUser?.id) {
      showToast.error('You cannot delete your own account');
      return;
    }
    setSelectedUser(u);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const res = await userService.delete(selectedUser.id);
      if (res.success) {
        showToast.success('User account deleted');
        setDeleteModalOpen(false);
        fetchUsers();
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Deletion failed');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>User Accounts</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Overview of registered authentication identities across all roles.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel" style={{ padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '240px' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search user by name or email..." />
        </div>

        <select
          value={selectedRole}
          onChange={(e) => { setSelectedRole(e.target.value); setPage(1); }}
          style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: '#121a2b', border: '1px solid var(--border-glass)', color: '#fff', fontSize: '0.88rem', outline: 'none' }}
        >
          <option value="">All Account Roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r.toUpperCase()}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <Spinner text="Loading user directory..." />
      ) : users.length === 0 ? (
        <EmptyState title="No User Accounts" message="No users match your filters." />
      ) : (
        <div className="glass-panel" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '14px 18px' }}>User ID</th>
                <th style={{ padding: '14px 18px' }}>Full Name</th>
                <th style={{ padding: '14px 18px' }}>Email Address</th>
                <th style={{ padding: '14px 18px' }}>Phone</th>
                <th style={{ padding: '14px 18px' }}>System Role</th>
                <th style={{ padding: '14px 18px' }}>Joined Date</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                  <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-muted)' }}>#{u.id}</td>
                  <td style={{ padding: '14px 18px', fontWeight: 600, color: '#fff' }}>{u.name}</td>
                  <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>{u.email}</td>
                  <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>{u.phone || 'N/A'}</td>
                  <td style={{ padding: '14px 18px' }}>
                    <StatusBadge status={u.role} />
                  </td>
                  <td style={{ padding: '14px 18px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    {formatDate(u.created_at)}
                  </td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    {u.id !== currentUser?.id && (
                      <button
                        onClick={() => handleDeleteClick(u)}
                        style={{ padding: '6px', color: 'var(--danger)', backgroundColor: 'var(--danger-bg)', borderRadius: 'var(--radius-sm)' }}
                        title="Delete User"
                      >
                        <FiTrash2 />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      {/* Delete Modal */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Confirm User Deletion">
        <p style={{ color: 'var(--text-muted)' }}>
          Are you sure you want to delete the user account for <strong style={{ color: '#fff' }}>{selectedUser?.name}</strong> ({selectedUser?.email})?
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button onClick={() => setDeleteModalOpen(false)} style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff' }}>Cancel</button>
          <button onClick={handleDeleteConfirm} style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--danger)', color: '#fff', fontWeight: 700 }}>Delete Account</button>
        </div>
      </Modal>
    </div>
  );
};

export default UsersPage;
