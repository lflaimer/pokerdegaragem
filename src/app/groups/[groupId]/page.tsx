'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface Member {
  id: string;
  userId: string;
  email: string;
  name: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  joinedAt: string;
}

interface DashboardData {
  period: {
    startDate: string | null;
    endDate: string | null;
  };
  summary: {
    totalGames: number;
    cashGames: number;
    tournaments: number;
    totalSpent: string;
    totalWon: string;
    groupNetResult: string;
  };
  playerStats: Array<{
    type: 'user' | 'guest';
    id?: string;
    name: string;
    email?: string;
    gamesPlayed: number;
    totalSpent: string;
    totalWon: string;
    netResult: string;
  }>;
  recentGames: Array<{
    id: string;
    date: string;
    gameType: string;
    participantCount: number;
    totalSpent: string;
    totalWon: string;
  }>;
}

interface Group {
  id: string;
  name: string;
  createdAt: string;
  gameCount: number;
  currentUserRole: 'OWNER' | 'ADMIN' | 'MEMBER';
  members: Member[];
}

export default function GroupDetailPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = use(params);
  const router = useRouter();
  const { t } = useLanguage();
  const [group, setGroup] = useState<Group | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchGroup = async () => {
    try {
      const res = await fetch(`/api/groups/${groupId}`);
      const data = await res.json();
      if (data.success) {
        setGroup(data.data.group);
      } else if (res.status === 403 || res.status === 404) {
        router.push('/groups');
      }
    } catch (error) {
      console.error('Failed to fetch group:', error);
    }
  };

  const fetchDashboard = async () => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const res = await fetch(`/api/groups/${groupId}/dashboard?${params}`);
      const data = await res.json();
      if (data.success) {
        setDashboard(data.data.dashboard);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      await Promise.all([fetchGroup(), fetchDashboard()]);
      setLoading(false);
    };
    fetchAll();
  }, [groupId]);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDashboard();
  };

  const formatMoney = (value: string) => {
    const num = parseFloat(value);
    if (num > 0) return `+${value}`;
    return value;
  };

  const getNetClass = (value: string) => {
    const num = parseFloat(value);
    if (num > 0) return 'text-poker-green';
    if (num < 0) return 'text-poker-red';
    return 'text-poker-brown/60';
  };

  const getRoleLabel = (role: 'OWNER' | 'ADMIN' | 'MEMBER') => {
    switch (role) {
      case 'OWNER': return t.roles.owner;
      case 'ADMIN': return t.roles.admin;
      default: return t.roles.member;
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-poker-gold"></div>
          </div>
        ) : group ? (
          <>
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-poker-brown">{group.name}</h1>
                  <Badge
                    variant={
                      group.currentUserRole === 'OWNER'
                        ? 'owner'
                        : group.currentUserRole === 'ADMIN'
                          ? 'admin'
                          : 'member'
                    }
                  >
                    {getRoleLabel(group.currentUserRole)}
                  </Badge>
                </div>
                <p className="mt-2 text-poker-brown/70">
                  {group.members.length} {t.groups.members} | {group.gameCount} {t.groups.games}
                </p>
              </div>
              <div className="flex gap-3">
                <Link href={`/groups/${groupId}/members`}>
                  <Button variant="secondary">{t.groups.manageMembers}</Button>
                </Link>
                <Link href={`/groups/${groupId}/games/new`}>
                  <Button variant="gold">{t.groups.addGame}</Button>
                </Link>
              </div>
            </div>

            {/* Filters */}
            <Card className="mb-8">
              <CardContent className="py-4">
                <form onSubmit={handleFilter} className="flex flex-wrap gap-4 items-end">
                  <div className="w-40">
                    <Input
                      label={t.dashboard.startDate}
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="w-40">
                    <Input
                      label={t.dashboard.endDate}
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                  <Button type="submit">{t.dashboard.applyFilter}</Button>
                  {(startDate || endDate) && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setStartDate('');
                        setEndDate('');
                        setTimeout(fetchDashboard, 0);
                      }}
                    >
                      {t.dashboard.clearFilter}
                    </Button>
                  )}
                </form>
              </CardContent>
            </Card>

            {dashboard && (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <Card className="border-l-4 border-l-poker-brown">
                    <CardContent className="py-4">
                      <p className="text-sm text-poker-brown/60">{t.groups.totalGames}</p>
                      <p className="text-2xl font-bold text-poker-brown">{dashboard.summary.totalGames}</p>
                      <p className="text-xs text-poker-brown/50">
                        {dashboard.summary.cashGames} {t.groups.cashGames} | {dashboard.summary.tournaments}{' '}
                        {t.groups.tournaments}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-l-poker-red">
                    <CardContent className="py-4">
                      <p className="text-sm text-poker-brown/60">{t.dashboard.totalSpent}</p>
                      <p className="text-2xl font-bold text-poker-brown">${dashboard.summary.totalSpent}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-l-poker-green">
                    <CardContent className="py-4">
                      <p className="text-sm text-poker-brown/60">{t.groups.totalWon}</p>
                      <p className="text-2xl font-bold text-poker-brown">${dashboard.summary.totalWon}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-l-poker-gold">
                    <CardContent className="py-4">
                      <p className="text-sm text-poker-brown/60">{t.groups.netBalance}</p>
                      <p
                        className={cn(
                          'text-2xl font-bold',
                          getNetClass(dashboard.summary.groupNetResult)
                        )}
                      >
                        ${formatMoney(dashboard.summary.groupNetResult)}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Player Standings */}
                  <Card>
                    <CardHeader>
                      <CardTitle>{t.groups.playerStandings}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {dashboard.playerStats.length === 0 ? (
                        <p className="text-poker-brown/60 text-center py-4">{t.dashboard.noGamesYet}</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-poker-brown/20">
                                <th className="text-left py-2 font-medium text-poker-brown/70">{t.groups.player}</th>
                                <th className="text-right py-2 font-medium text-poker-brown/70">{t.groups.games}</th>
                                <th className="text-right py-2 font-medium text-poker-brown/70">{t.groups.net}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dashboard.playerStats.map((player, idx) => (
                                <tr key={idx} className="border-b border-poker-brown/10 last:border-0 hover:bg-poker-gold/5">
                                  <td className="py-2 text-poker-brown">
                                    <span>{player.name}</span>
                                    {player.type === 'guest' && (
                                      <span className="ml-1 text-xs text-poker-brown/50">({t.groups.guest})</span>
                                    )}
                                  </td>
                                  <td className="text-right py-2 text-poker-brown">{player.gamesPlayed}</td>
                                  <td
                                    className={cn(
                                      'text-right py-2 font-medium',
                                      getNetClass(player.netResult)
                                    )}
                                  >
                                    ${formatMoney(player.netResult)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Recent Games */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>{t.dashboard.recentGames}</CardTitle>
                      <Link href={`/groups/${groupId}/games/new`}>
                        <Button size="sm" variant="gold">{t.groups.addGame}</Button>
                      </Link>
                    </CardHeader>
                    <CardContent>
                      {dashboard.recentGames.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-poker-brown/60 mb-4">{t.dashboard.noGamesYet}</p>
                          <Link href={`/groups/${groupId}/games/new`}>
                            <Button variant="gold">{t.groups.recordFirst}</Button>
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {dashboard.recentGames.map((game) => (
                            <Link
                              key={game.id}
                              href={`/groups/${groupId}/games/${game.id}`}
                              className="block p-3 border-2 border-poker-brown/10 rounded-lg hover:bg-poker-gold/10 hover:border-poker-gold/30 transition-colors"
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="font-medium text-poker-brown">{formatDate(game.date)}</p>
                                  <div className="flex items-center gap-2 text-sm text-poker-brown/60">
                                    <span className="px-2 py-0.5 bg-poker-green/10 text-poker-green rounded text-xs">
                                      {game.gameType === 'CASH' ? t.games.cashGame : t.games.tournament}
                                    </span>
                                    <span>{game.participantCount} {t.games.participants.toLowerCase()}</span>
                                  </div>
                                </div>
                                <div className="text-right text-sm">
                                  <p className="text-poker-brown/60">
                                    ${game.totalSpent} {t.dashboard.spent.toLowerCase()}
                                  </p>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-poker-brown/70">{t.errors.notFound}</p>
            <Link href="/groups">
              <Button variant="gold" className="mt-4">{t.common.back}</Button>
            </Link>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
