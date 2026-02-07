'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface GroupInfo {
  id: string;
  name: string;
  memberCount: number;
}

export default function JoinGroupPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const res = await fetch(`/api/join/${token}`);
        const data = await res.json();
        if (data.success) {
          setGroup(data.data.group);
        } else {
          setError(data.error || t.members.invalidLink);
        }
      } catch {
        setError(t.errors.failedToLoad);
      } finally {
        setLoading(false);
      }
    };
    fetchGroup();
  }, [token, t.members.invalidLink, t.errors.failedToLoad]);

  const handleJoin = async () => {
    if (!user) {
      // Store token in sessionStorage and redirect to signup
      sessionStorage.setItem('pendingJoinToken', token);
      router.push('/auth/signup');
      return;
    }

    setJoining(true);
    setError('');

    try {
      const res = await fetch(`/api/join/${token}`, {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t.errors.somethingWentWrong);
      }

      router.push(`/groups/${data.data.group.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errors.somethingWentWrong);
    } finally {
      setJoining(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-poker-gold"></div>
      </div>
    );
  }

  if (error && !group) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 bg-felt-pattern">
        <Card className="w-full max-w-md shadow-2xl">
          <CardContent className="py-8 text-center">
            <div className="text-4xl mb-4">&#128533;</div>
            <h2 className="text-xl font-semibold text-poker-brown mb-2">
              {t.members.invalidLink}
            </h2>
            <p className="text-poker-brown/60 mb-6">{error}</p>
            <Link href="/">
              <Button variant="gold">{t.invites.goHome}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!group) return null;

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 bg-felt-pattern">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="bg-poker-brown rounded-t-xl">
          <CardTitle className="text-center text-2xl text-poker-gold">
            {t.members.joinGroup}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <div className="text-4xl mb-4">&#127183;</div>
            <p className="text-poker-brown/70">{t.members.youreInvited}</p>
            <h3 className="text-2xl font-bold text-poker-brown mt-2">{group.name}</h3>
            <p className="text-sm text-poker-brown/60 mt-1">
              {group.memberCount} {group.memberCount === 1 ? t.invites.memberCount : t.invites.membersCount}
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
                {t.members.signInToJoin}
              </p>
              <div className="flex flex-col gap-2">
                <Button variant="gold" className="w-full" onClick={handleJoin}>
                  {t.auth.signUpTitle}
                </Button>
                <Link href="/auth/signin">
                  <Button variant="secondary" className="w-full">
                    {t.auth.signInTitle}
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-center text-poker-brown/70">
                {t.members.joinAs} <strong>{user.name}</strong>
              </p>
              <Button
                variant="gold"
                className="w-full"
                onClick={handleJoin}
                loading={joining}
              >
                {t.members.joinGroup}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
