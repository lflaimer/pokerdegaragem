'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';

interface Member {
  id: string;
  userId: string;
  email: string;
  name: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  joinedAt: string;
}

interface Invite {
  id: string;
  inviteeEmail: string;
  inviter: {
    id: string;
    name: string;
  };
  token: string;
  expiresAt: string;
  createdAt: string;
}

interface Group {
  id: string;
  name: string;
  currentUserRole: 'OWNER' | 'ADMIN' | 'MEMBER';
  members: Member[];
}

export default function MembersPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [group, setGroup] = useState<Group | null>(null);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState('');
  const [inviteLink, setInviteLink] = useState('');

  // Public invite link state
  const [publicInviteLink, setPublicInviteLink] = useState<string | null>(null);
  const [publicLinkLoading, setPublicLinkLoading] = useState(false);
  const [publicLinkCopied, setPublicLinkCopied] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [groupRes, invitesRes] = await Promise.all([
        fetch(`/api/groups/${groupId}`),
        fetch(`/api/groups/${groupId}/invites`),
      ]);

      const groupData = await groupRes.json();
      const invitesData = await invitesRes.json();

      if (groupData.success) {
        setGroup(groupData.data.group);
      } else if (groupRes.status === 403 || groupRes.status === 404) {
        router.push('/groups');
        return;
      }

      if (invitesData.success) {
        setInvites(invitesData.data.invites);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPublicInvite = async () => {
    try {
      const res = await fetch(`/api/groups/${groupId}/public-invite`);
      const data = await res.json();
      if (data.success) {
        setPublicInviteLink(data.data.inviteLink);
      }
    } catch (error) {
      console.error('Failed to fetch public invite:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [groupId]);

  useEffect(() => {
    if (group && (group.currentUserRole === 'OWNER' || group.currentUserRole === 'ADMIN')) {
      fetchPublicInvite();
    }
  }, [group?.currentUserRole, groupId]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInviting(true);
    setInviteLink('');

    try {
      const res = await fetch(`/api/groups/${groupId}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteeEmail: inviteEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send invite');
      }

      setInviteLink(data.data.invite.inviteLink);
      setInviteEmail('');
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invite');
    } finally {
      setInviting(false);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    try {
      const res = await fetch(`/api/groups/${groupId}/invites/${inviteId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Failed to cancel invite:', error);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm(t.members.confirmRemove)) return;

    try {
      const res = await fetch(`/api/groups/${groupId}/members/${memberId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };

  const handleChangeRole = async (memberId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/groups/${groupId}/members/${memberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Failed to change role:', error);
    }
  };

  const handleGeneratePublicLink = async () => {
    setPublicLinkLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/public-invite`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setPublicInviteLink(data.data.inviteLink);
      }
    } catch (error) {
      console.error('Failed to generate public link:', error);
    } finally {
      setPublicLinkLoading(false);
    }
  };

  const handleDisablePublicLink = async () => {
    setPublicLinkLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/public-invite`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setPublicInviteLink(null);
      }
    } catch (error) {
      console.error('Failed to disable public link:', error);
    } finally {
      setPublicLinkLoading(false);
    }
  };

  const handleCopyPublicLink = () => {
    if (publicInviteLink) {
      navigator.clipboard.writeText(publicInviteLink);
      setPublicLinkCopied(true);
      setTimeout(() => setPublicLinkCopied(false), 2000);
    }
  };

  const canManageMembers =
    group?.currentUserRole === 'OWNER' || group?.currentUserRole === 'ADMIN';
  const isOwner = group?.currentUserRole === 'OWNER';

  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-poker-gold"></div>
          </div>
        ) : group ? (
          <>
            {/* Header */}
            <div className="mb-8">
              <Link
                href={`/groups/${groupId}`}
                className="text-poker-gold hover:text-poker-gold-dark hover:underline text-sm mb-2 inline-block"
              >
                &larr; {t.common.back} {group.name}
              </Link>
              <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-poker-brown">{t.members.title}</h1>
                {canManageMembers && (
                  <Button variant="gold" onClick={() => setShowInviteModal(true)}>
                    {t.members.inviteMember}
                  </Button>
                )}
              </div>
            </div>

            {/* Public Invite Link */}
            {canManageMembers && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>{t.members.publicInviteLink}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-poker-brown/70 mb-4">
                    {t.members.publicInviteDesc}
                  </p>

                  {publicInviteLink ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 p-3 bg-poker-green/10 border border-poker-green/30 rounded-lg">
                        <svg className="w-5 h-5 text-poker-green flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm text-poker-green font-medium">{t.members.linkEnabled}</span>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          value={publicInviteLink}
                          readOnly
                          className="font-mono text-xs flex-1"
                        />
                        <Button
                          variant="secondary"
                          onClick={handleCopyPublicLink}
                        >
                          {publicLinkCopied ? t.members.linkCopied : t.members.copyLink}
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={handleGeneratePublicLink}
                          loading={publicLinkLoading}
                        >
                          {t.members.regenerateLink}
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={handleDisablePublicLink}
                          loading={publicLinkLoading}
                        >
                          {t.members.disableLink}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 p-3 bg-poker-brown/5 border border-poker-brown/20 rounded-lg">
                        <svg className="w-5 h-5 text-poker-brown/50 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                        <span className="text-sm text-poker-brown/60">{t.members.linkDisabled}</span>
                      </div>
                      <Button
                        variant="gold"
                        onClick={handleGeneratePublicLink}
                        loading={publicLinkLoading}
                      >
                        {t.members.generateLink}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Members List */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>{t.members.currentMembers} ({group.members.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-poker-brown/10">
                  {group.members.map((member) => (
                    <div key={member.id} className="py-4 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-poker-brown">{member.name}</span>
                          {member.userId === user?.id && (
                            <span className="text-xs text-poker-brown/50">({t.members.you})</span>
                          )}
                          <Badge
                            variant={
                              member.role === 'OWNER'
                                ? 'owner'
                                : member.role === 'ADMIN'
                                  ? 'admin'
                                  : 'member'
                            }
                          >
                            {t.roles[member.role.toLowerCase() as 'owner' | 'admin' | 'member']}
                          </Badge>
                        </div>
                        <p className="text-sm text-poker-brown/60">{member.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isOwner && member.role !== 'OWNER' && (
                          <>
                            <Select
                              options={[
                                { value: 'ADMIN', label: t.roles.admin },
                                { value: 'MEMBER', label: t.roles.member },
                              ]}
                              value={member.role}
                              onChange={(e) => handleChangeRole(member.id, e.target.value)}
                              className="w-28"
                            />
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleRemoveMember(member.id)}
                            >
                              {t.members.remove}
                            </Button>
                          </>
                        )}
                        {canManageMembers &&
                          !isOwner &&
                          member.role === 'MEMBER' &&
                          member.userId !== user?.id && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleRemoveMember(member.id)}
                            >
                              {t.members.remove}
                            </Button>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Pending Invites */}
            {canManageMembers && (
              <Card>
                <CardHeader>
                  <CardTitle>{t.members.pendingInvites} ({invites.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {invites.length === 0 ? (
                    <p className="text-poker-brown/60 text-center py-4">{t.members.noPendingInvites}</p>
                  ) : (
                    <div className="divide-y divide-poker-brown/10">
                      {invites.map((invite) => (
                        <div key={invite.id} className="py-4 flex items-center justify-between">
                          <div>
                            <p className="font-medium text-poker-brown">{invite.inviteeEmail}</p>
                            <p className="text-sm text-poker-brown/60">
                              {t.members.invitedBy} {invite.inviter.name}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  `${window.location.origin}/invites/${invite.token}`
                                );
                                alert(t.members.linkCopied);
                              }}
                            >
                              {t.members.copyLink}
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleCancelInvite(invite.id)}
                            >
                              {t.common.cancel}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Invite Modal */}
            <Modal
              isOpen={showInviteModal}
              onClose={() => {
                setShowInviteModal(false);
                setInviteEmail('');
                setError('');
                setInviteLink('');
              }}
              title={t.members.inviteMember}
            >
              {inviteLink ? (
                <div className="space-y-4">
                  <p className="text-poker-green font-medium">{t.members.inviteCreated}</p>
                  <p className="text-sm text-poker-brown/70">
                    {t.members.shareLinkDesc}
                  </p>
                  <div className="flex gap-2">
                    <Input value={inviteLink} readOnly className="font-mono text-xs" />
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(inviteLink);
                        alert(t.members.linkCopied);
                      }}
                    >
                      {t.members.copyLink}
                    </Button>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setShowInviteModal(false);
                        setInviteLink('');
                      }}
                    >
                      {t.common.close}
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleInvite} className="space-y-4">
                  {error && (
                    <div className="bg-poker-red/10 border border-poker-red/30 text-poker-red px-4 py-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}
                  <Input
                    label={t.members.emailAddress}
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder={t.members.emailPlaceholder}
                    required
                  />
                  <p className="text-sm text-poker-brown/60">
                    {t.members.inviteLinkDesc}
                  </p>
                  <div className="flex justify-end space-x-3">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setShowInviteModal(false);
                        setInviteEmail('');
                        setError('');
                      }}
                    >
                      {t.common.cancel}
                    </Button>
                    <Button type="submit" loading={inviting}>
                      {t.members.createInvite}
                    </Button>
                  </div>
                </form>
              )}
            </Modal>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-poker-brown/70">{t.errors.notFound}</p>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
