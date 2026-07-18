import { getImageUrl } from '../../constants/index';
import React, { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import { adminService } from '../../services/portalService';
import toast from 'react-hot-toast';
import {
  IoPeopleOutline,
  IoPersonOutline,
  IoSchoolOutline,
  IoShieldOutline,
  IoTrashOutline,
  IoToggleOutline,
  IoSearchOutline,
  IoRefreshOutline,
} from 'react-icons/io5';

const roleBadge = {
  STUDENT: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  INSTRUCTOR: 'bg-violet-50 text-violet-700 border-violet-100',
  ADMIN: 'bg-red-50 text-red-700 border-red-100',
};

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [actionId, setActionId] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });

  const fetchUsers = async (page = 1) => {
    setLoading(true);
    try {
      const res = await adminService.getUsers({ search, role: roleFilter, page, limit: 15 });
      if (res.data?.data) {
        setUsers(res.data.data.users);
        setPagination(res.data.data.pagination);
      }
    } catch (err) {
      toast.error('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [search, roleFilter]);

  const handleToggleActive = async (userId) => {
    setActionId(userId);
    try {
      const res = await adminService.toggleUserActive(userId);
      toast.success(res.data?.message || 'Status updated.');
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isActive: !u.isActive } : u))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.');
    } finally {
      setActionId(null);
    }
  };



  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure? This will permanently delete the user.')) return;
    setActionId(userId);
    try {
      await adminService.deleteUser(userId);
      toast.success('User deleted.');
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user.');
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-primary-900">User Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            {pagination.total} total users · manage roles, access, and accounts.
          </p>
        </div>
        <button
          onClick={() => fetchUsers()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-600 transition-all cursor-pointer"
        >
          <IoRefreshOutline size={14} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <IoSearchOutline size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-100 bg-white focus:outline-none focus:border-primary-300"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-100 bg-white text-sm focus:outline-none focus:border-primary-300"
        >
          <option value="">All Roles</option>
          <option value="STUDENT">Students</option>
          <option value="INSTRUCTOR">Instructors</option>
          <option value="ADMIN">Admins</option>
        </select>
      </div>

      {/* Table */}
      <Card hover={false} className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-slate-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <IoPeopleOutline size={40} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">No users found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-50 bg-slate-50/80">
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Activity</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Joined</th>
                  <th className="text-right px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-heading font-bold text-sm shrink-0">
                          {user.avatar ? (
                            <img src={getImageUrl(user.avatar)} alt={user.name} className="h-9 w-9 rounded-full object-cover" />
                          ) : (
                            user.name?.split(' ').map((n) => n[0]).join('') || '?'
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{user.name}</p>
                          <p className="text-xs text-slate-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${roleBadge[user.role] || ''}`}>
                        {user.role === 'STUDENT' ? 'Student' : user.role === 'INSTRUCTOR' ? 'Instructor' : 'Admin'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <IoSchoolOutline size={12} /> {user._count?.enrollments || 0} courses
                        </span>
                        {user.role === 'INSTRUCTOR' && (
                          <span className="flex items-center gap-1">
                            <IoPersonOutline size={12} /> {user._count?.courses || 0} created
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          user.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : 'bg-red-50 text-red-600 border-red-100'
                        }`}
                      >
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => handleToggleActive(user.id)}
                          disabled={actionId === user.id}
                          title={user.isActive ? 'Deactivate' : 'Activate'}
                          className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                            user.isActive
                              ? 'text-amber-500 hover:bg-amber-50 hover:text-amber-700'
                              : 'text-emerald-500 hover:bg-emerald-50 hover:text-emerald-700'
                          }`}
                        >
                          <IoToggleOutline size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          disabled={actionId === user.id}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                        >
                          <IoTrashOutline size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Page {pagination.page} of {pagination.totalPages} · {pagination.total} users</span>
          <div className="flex gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => fetchUsers(pagination.page - 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-100 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              ← Prev
            </button>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchUsers(pagination.page + 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-100 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
