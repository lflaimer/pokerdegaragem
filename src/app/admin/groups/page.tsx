'use client';

import { useEffect, useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

interface Group {
  id: string;
  name: string;
  createdAt: string;
  memberCount: number;
  gameCount: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminGroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; group: Group | null }>({
    open: false,
    group: null,
  });
  const [deleting, setDeleting] = useState(false);
  const { t } = useLanguage();

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
      });
      const res = await fetch(`/api/admin/groups?${params}`);
      if (!res.ok) throw new Error('Failed to fetch groups');
      const data = await res.json();
      setGroups(data.data.groups);
      setPagination(data.data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errors.failedToLoad);
    } finally {
      setLoading(false);
    }
  }, [page, search, t.errors.failedToLoad]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchGroups();
  };

  const handleDelete = async () => {
    if (!deleteModal.group) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/groups/${deleteModal.group.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete group');
      setDeleteModal({ open: false, group: null });
      fetchGroups();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errors.somethingWentWrong);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">{t.admin.groups}</h1>

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
                    {t.admin.groupName}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    {t.admin.memberCount}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    {t.admin.gameCount}
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
                {groups.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                      {t.admin.noResults}
                    </td>
                  </tr>
                ) : (
                  groups.map((group) => (
                    <tr key={group.id} className="hover:bg-gray-700/50">
                      <td className="px-6 py-4 text-white">{group.name}</td>
                      <td className="px-6 py-4 text-gray-300">{group.memberCount}</td>
                      <td className="px-6 py-4 text-gray-300">{group.gameCount}</td>
                      <td className="px-6 py-4 text-gray-300">
                        {formatDate(new Date(group.createdAt))}
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setDeleteModal({ open: true, group })}
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
        onClose={() => setDeleteModal({ open: false, group: null })}
        title={t.admin.deleteGroup}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">{t.admin.confirmDelete}</p>
          {deleteModal.group && (
            <p className="font-semibold text-gray-800">{deleteModal.group.name}</p>
          )}
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => setDeleteModal({ open: false, group: null })}
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
