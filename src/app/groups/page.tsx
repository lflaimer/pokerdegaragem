'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';

interface Group {
  id: string;
  name: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  memberCount: number;
  gameCount: number;
  createdAt: string;
  joinedAt: string;
}

export default function GroupsPage() {
  const { t } = useLanguage();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const fetchGroups = async () => {
    try {
      const res = await fetch('/api/groups');
      const data = await res.json();
      if (data.success) {
        setGroups(data.data.groups);
      }
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCreating(true);

    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGroupName }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t.errors.somethingWentWrong);
      }

      setShowCreateModal(false);
      setNewGroupName('');
      fetchGroups();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errors.somethingWentWrong);
    } finally {
      setCreating(false);
    }
  };

  const getRoleBadgeVariant = (role: Group['role']) => {
    switch (role) {
      case 'OWNER':
        return 'owner';
      case 'ADMIN':
        return 'admin';
      default:
        return 'member';
    }
  };

  const getRoleLabel = (role: Group['role']) => {
    switch (role) {
      case 'OWNER':
        return t.roles.owner;
      case 'ADMIN':
        return t.roles.admin;
      default:
        return t.roles.member;
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-poker-brown">{t.groups.title}</h1>
            <p className="mt-2 text-poker-brown/70">{t.groups.subtitle}</p>
          </div>
          <Button variant="gold" onClick={() => setShowCreateModal(true)}>{t.groups.createGroup}</Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-poker-gold"></div>
          </div>
        ) : groups.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-4xl mb-4">&#127183;</div>
              <h3 className="text-lg font-medium text-poker-brown mb-2">{t.groups.noGroupsYet}</h3>
              <p className="text-poker-brown/60 mb-6">
                {t.groups.noGroupsDesc}
              </p>
              <Button variant="gold" onClick={() => setShowCreateModal(true)}>{t.groups.createFirst}</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <Link key={group.id} href={`/groups/${group.id}`}>
                <Card className="h-full hover:shadow-xl hover:border-poker-gold/50 transition-all cursor-pointer">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl">{group.name}</CardTitle>
                      <Badge variant={getRoleBadgeVariant(group.role)}>{getRoleLabel(group.role)}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-poker-brown/70">
                      <div className="flex justify-between">
                        <span>{t.groups.members}</span>
                        <span className="font-medium text-poker-brown">{group.memberCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t.groups.games}</span>
                        <span className="font-medium text-poker-brown">{group.gameCount}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Create Group Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setNewGroupName('');
            setError('');
          }}
          title={t.groups.createNew}
        >
          <form onSubmit={handleCreateGroup} className="space-y-4">
            {error && (
              <div className="bg-poker-red/10 border border-poker-red/30 text-poker-red px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            <Input
              label={t.groups.groupName}
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder={t.groups.groupNamePlaceholder}
              required
            />
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowCreateModal(false);
                  setNewGroupName('');
                  setError('');
                }}
              >
                {t.common.cancel}
              </Button>
              <Button type="submit" loading={creating}>
                {t.groups.createGroup}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </ProtectedRoute>
  );
}
