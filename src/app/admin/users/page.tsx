'use client';

import { useEffect, useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  groupCount: number;
  gameCount: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; user: User | null }>({
    open: false,
    user: null,
  });
  const [deleting, setDeleting] = useState(false);
  const { t } = useLanguage();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
      });
      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data.data.users);
      setPagination(data.data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errors.failedToLoad);
    } finally {
      setLoading(false);
    }
  }, [page, search, t.errors.failedToLoad]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleDelete = async () => {
    if (!deleteModal.user) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${deleteModal.user.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete user');
      setDeleteModal({ open: false, user: null });
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errors.somethingWentWrong);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">{t.admin.users}</h1>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.admin.search}
          className="flex-1 max-w-md px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-poker-gold focus:border-transparent"
        />
        <Button type="submit" variant="gold">
          {t.admin.search.replace('...', '')}
        </Button>
      </form>

      {error && (
        <div className="bg-poker-red/20 border border-poker-red text-poker-red p-4 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-poker-gold"></div>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    {t.admin.name}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    {t.admin.email}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    {t.admin.groups}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    {t.dashboard.gamesPlayed}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    {t.admin.createdAt}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    {t.admin.actions}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                      {t.admin.noResults}
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-700/50">
                      <td className="px-6 py-4 text-white">{user.name}</td>
                      <td className="px-6 py-4 text-gray-300">{user.email}</td>
                      <td className="px-6 py-4 text-gray-300">{user.groupCount}</td>
                      <td className="px-6 py-4 text-gray-300">{user.gameCount}</td>
                      <td className="px-6 py-4 text-gray-300">
                        {formatDate(new Date(user.createdAt))}
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setDeleteModal({ open: true, user })}
                        >
                          {t.common.delete}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-gray-400">
                {t.admin.page} {pagination.page} {t.admin.of} {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  {t.admin.previous}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                >
                  {t.admin.next}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, user: null })}
        title={t.admin.deleteUser}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">{t.admin.confirmDelete}</p>
          {deleteModal.user && (
            <p className="font-semibold text-gray-800">
              {deleteModal.user.name} ({deleteModal.user.email})
            </p>
          )}
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => setDeleteModal({ open: false, user: null })}
            >
              {t.common.cancel}
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>
              {t.common.delete}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
