'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
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
  const [group, setGroup] = useState<Group | null>(null);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState('');
  const [inviteLink, setInviteLink] = useState('');

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

  useEffect(() => {
    fetchData();
  }, [groupId]);

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
    if (!confirm('Are you sure you want to remove this member?')) return;

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
                &larr; Back to {group.name}
              </Link>
              <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-poker-brown">Members</h1>
                {canManageMembers && (
                  <Button variant="gold" onClick={() => setShowInviteModal(true)}>Invite Member</Button>
                )}
              </div>
            </div>

            {/* Members List */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Current Members ({group.members.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-poker-brown/10">
                  {group.members.map((member) => (
                    <div key={member.id} className="py-4 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-poker-brown">{member.name}</span>
                          {member.userId === user?.id && (
                            <span className="text-xs text-poker-brown/50">(you)</span>
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
                            {member.role}
                          </Badge>
                        </div>
                        <p className="text-sm text-poker-brown/60">{member.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isOwner && member.role !== 'OWNER' && (
                          <>
                            <Select
                              options={[
                                { value: 'ADMIN', label: 'Admin' },
                                { value: 'MEMBER', label: 'Member' },
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
                              Remove
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
                              Remove
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
                  <CardTitle>Pending Invites ({invites.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {invites.length === 0 ? (
                    <p className="text-poker-brown/60 text-center py-4">No pending invites</p>
                  ) : (
                    <div className="divide-y divide-poker-brown/10">
                      {invites.map((invite) => (
                        <div key={invite.id} className="py-4 flex items-center justify-between">
                          <div>
                            <p className="font-medium text-poker-brown">{invite.inviteeEmail}</p>
                            <p className="text-sm text-poker-brown/60">
                              Invited by {invite.inviter.name}
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
                                alert('Invite link copied to clipboard!');
                              }}
                            >
                              Copy Link
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleCancelInvite(invite.id)}
                            >
                              Cancel
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
              title="Invite Member"
            >
              {inviteLink ? (
                <div className="space-y-4">
                  <p className="text-poker-green font-medium">Invite created successfully!</p>
                  <p className="text-sm text-poker-brown/70">
                    Share this link with the person you want to invite:
                  </p>
                  <div className="flex gap-2">
                    <Input value={inviteLink} readOnly className="font-mono text-xs" />
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(inviteLink);
                        alert('Link copied!');
                      }}
                    >
                      Copy
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
                      Close
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
                    label="Email Address"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="friend@example.com"
                    required
                  />
                  <p className="text-sm text-poker-brown/60">
                    An invite link will be generated. You can share it with the person you want to
                    invite.
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
                      Cancel
                    </Button>
                    <Button type="submit" loading={inviting}>
                      Create Invite
                    </Button>
                  </div>
                </form>
              )}
            </Modal>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-poker-brown/70">Group not found</p>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
