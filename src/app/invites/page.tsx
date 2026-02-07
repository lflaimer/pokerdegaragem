'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface Invite {
  id: string;
  group: {
    id: string;
    name: string;
  };
  inviter: {
    id: string;
    name: string;
  };
  seenAt?: string | null;
  status?: string;
  expiresAt?: string;
  createdAt: string;
}

export default function InvitesPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [pendingInvites, setPendingInvites] = useState<Invite[]>([]);
  const [historyInvites, setHistoryInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);

  const fetchInvites = async () => {
    setLoading(true);
    try {
      const [pendingRes, historyRes] = await Promise.all([
        fetch('/api/user/invites'),
        fetch('/api/user/invites/history'),
      ]);

      const pendingData = await pendingRes.json();
      const historyData = await historyRes.json();

      if (pendingData.success) {
        setPendingInvites(pendingData.data.invites);
      }
      if (historyData.success) {
        setHistoryInvites(historyData.data.invites);
      }
    } catch (error) {
      console.error('Failed to fetch invites:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvites();
    // Mark as seen when page loads
    fetch('/api/user/invites/mark-seen', { method: 'POST' }).catch(console.error);
  }, []);

  const handleRespond = async (inviteId: string, accept: boolean) => {
    setRespondingTo(inviteId);
    try {
      const res = await fetch(`/api/user/invites/${inviteId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accept }),
      });

      const data = await res.json();
      if (data.success) {
        if (accept && data.data.group) {
          router.push(`/groups/${data.data.group.id}`);
        } else {
          fetchInvites();
        }
      }
    } catch (error) {
      console.error('Failed to respond to invite:', error);
    } finally {
      setRespondingTo(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return <Badge variant="success">{t.invites.accepted}</Badge>;
      case 'DECLINED':
        return <Badge variant="danger">{t.invites.declined}</Badge>;
      case 'EXPIRED':
        return <Badge variant="secondary">{t.invites.expired}</Badge>;
      default:
        return null;
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-poker-brown">{t.invites.myInvites}</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-poker-gold"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Pending Invites */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {t.invites.pendingInvites} ({pendingInvites.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingInvites.length === 0 ? (
                  <p className="text-poker-brown/60 text-center py-6">{t.invites.noInvites}</p>
                ) : (
                  <div className="divide-y divide-poker-brown/10">
                    {pendingInvites.map((invite) => (
                      <div key={invite.id} className="py-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-poker-brown text-lg">{invite.group.name}</p>
                            <p className="text-sm text-poker-brown/60">
                              {t.invites.invitedBy} {invite.inviter.name}
                            </p>
                            <p className="text-xs text-poker-brown/50 mt-1">
                              {formatDate(invite.createdAt)}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="gold"
                              onClick={() => handleRespond(invite.id, true)}
                              loading={respondingTo === invite.id}
                              disabled={respondingTo !== null}
                            >
                              {t.invites.accept}
                            </Button>
                            <Button
                              variant="secondary"
                              onClick={() => handleRespond(invite.id, false)}
                              loading={respondingTo === invite.id}
                              disabled={respondingTo !== null}
                            >
                              {t.invites.decline}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Invite History */}
            <Card>
              <CardHeader>
                <CardTitle>{t.invites.inviteHistory}</CardTitle>
              </CardHeader>
              <CardContent>
                {historyInvites.length === 0 ? (
                  <p className="text-poker-brown/60 text-center py-6">{t.invites.noHistory}</p>
                ) : (
                  <div className="divide-y divide-poker-brown/10">
                    {historyInvites.map((invite) => (
                      <div key={invite.id} className="py-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-poker-brown">{invite.group.name}</p>
                              {invite.status && getStatusBadge(invite.status)}
                            </div>
                            <p className="text-sm text-poker-brown/60">
                              {t.invites.invitedBy} {invite.inviter.name}
                            </p>
                            <p className="text-xs text-poker-brown/50 mt-1">
                              {formatDate(invite.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
