'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Invite {
  id: string;
  inviteeEmail: string;
  status: string;
  isValid: boolean;
  group: {
    id: string;
    name: string;
    memberCount: number;
  };
  inviter: {
    id: string;
    name: string;
    email: string;
  };
  expiresAt: string;
  createdAt: string;
}

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [invite, setInvite] = useState<Invite | null>(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInvite = async () => {
      try {
        const res = await fetch(`/api/invites/${token}`);
        const data = await res.json();
        if (data.success) {
          setInvite(data.data.invite);
        } else {
          setError(data.error || 'Invite not found');
        }
      } catch (err) {
        setError('Failed to load invite');
      } finally {
        setLoading(false);
      }
    };
    fetchInvite();
  }, [token]);

  const handleRespond = async (accept: boolean) => {
    if (!user) {
      router.push(`/auth/signin?redirect=/invites/${token}`);
      return;
    }

    setResponding(true);
    setError('');

    try {
      const res = await fetch(`/api/invites/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accept }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to respond to invite');
      }

      if (accept) {
        router.push(`/groups/${data.data.group.id}`);
      } else {
        router.push('/groups');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to respond to invite');
    } finally {
      setResponding(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-poker-gold"></div>
      </div>
    );
  }

  if (error && !invite) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 bg-felt-pattern">
        <Card className="w-full max-w-md shadow-2xl">
          <CardContent className="py-8 text-center">
            <div className="text-4xl mb-4">&#128533;</div>
            <h2 className="text-xl font-semibold text-poker-brown mb-2">Invite Not Found</h2>
            <p className="text-poker-brown/60 mb-6">{error}</p>
            <Link href="/">
              <Button variant="gold">Go Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invite) return null;

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 bg-felt-pattern">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="bg-poker-brown rounded-t-xl">
          <CardTitle className="text-center text-2xl text-poker-gold">Group Invitation</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {!invite.isValid ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-4">&#8987;</div>
              <h3 className="text-lg font-medium text-poker-brown mb-2">
                {invite.status === 'EXPIRED' ? 'Invite Expired' : `Invite ${invite.status}`}
              </h3>
              <p className="text-poker-brown/60 mb-6">
                This invite is no longer valid. Please request a new invite from the group admin.
              </p>
              <Link href="/">
                <Button variant="gold">Go Home</Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">&#127183;</div>
                <p className="text-poker-brown/70">
                  <span className="font-medium text-poker-brown">{invite.inviter.name}</span> has invited you to join
                </p>
                <h3 className="text-2xl font-bold text-poker-brown mt-2">{invite.group.name}</h3>
                <p className="text-sm text-poker-brown/60 mt-1">
                  {invite.group.memberCount} member{invite.group.memberCount !== 1 ? 's' : ''}
                </p>
              </div>

              {error && (
                <div className="mb-4 bg-poker-red/10 border border-poker-red/30 text-poker-red px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {!user ? (
                <div className="space-y-4">
                  <p className="text-center text-poker-brown/70">
                    Please sign in to accept this invitation.
                  </p>
                  <p className="text-center text-sm text-poker-brown/60">
                    Invite sent to: <strong className="text-poker-brown">{invite.inviteeEmail}</strong>
                  </p>
                  <div className="flex flex-col gap-2">
                    <Link href={`/auth/signin`}>
                      <Button variant="gold" className="w-full">Sign In</Button>
                    </Link>
                    <Link href={`/auth/signup`}>
                      <Button variant="secondary" className="w-full">
                        Create Account
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : user.email.toLowerCase() !== invite.inviteeEmail.toLowerCase() ? (
                <div className="text-center">
                  <p className="text-poker-gold-dark mb-4">
                    This invite was sent to <strong>{invite.inviteeEmail}</strong>, but you are
                    signed in as <strong>{user.email}</strong>.
                  </p>
                  <p className="text-sm text-poker-brown/60 mb-4">
                    Please sign in with the correct account to accept this invite.
                  </p>
                  <Link href="/auth/signin">
                    <Button variant="secondary">Sign in with different account</Button>
                  </Link>
                </div>
              ) : (
                <div className="flex gap-4">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => handleRespond(false)}
                    loading={responding}
                  >
                    Decline
                  </Button>
                  <Button
                    variant="gold"
                    className="flex-1"
                    onClick={() => handleRespond(true)}
                    loading={responding}
                  >
                    Accept
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
