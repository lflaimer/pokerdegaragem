'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface DashboardData {
  period: {
    startDate: string | null;
    endDate: string | null;
  };
  summary: {
    totalGroups: number;
    totalGamesPlayed: number;
    totalSpent: string;
    totalWon: string;
    overallNetResult: string;
  };
  groupBreakdown: Array<{
    id: string;
    name: string;
    gamesPlayed: number;
    totalSpent: string;
    totalWon: string;
    netResult: string;
  }>;
  recentGames: Array<{
    id: string;
    groupId: string;
    groupName: string;
    date: string;
    gameType: string;
    spent: string;
    won: string;
    net: string;
  }>;
}

export default function Dashboard() {
  const { t } = useLanguage();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const res = await fetch(`/api/dashboard?${params}`);
      const data = await res.json();
      if (data.success) {
        setDashboard(data.data.dashboard);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

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

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-poker-brown">{t.dashboard.title}</h1>
          <p className="mt-2 text-poker-brown/70">{t.dashboard.subtitle}</p>
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

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-poker-gold"></div>
          </div>
        ) : dashboard ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="border-l-4 border-l-poker-brown">
                <CardContent className="py-6">
                  <p className="text-sm text-poker-brown/60">{t.dashboard.groups}</p>
                  <p className="text-3xl font-bold text-poker-brown">{dashboard.summary.totalGroups}</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-poker-green">
                <CardContent className="py-6">
                  <p className="text-sm text-poker-brown/60">{t.dashboard.gamesPlayed}</p>
                  <p className="text-3xl font-bold text-poker-brown">{dashboard.summary.totalGamesPlayed}</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-poker-red">
                <CardContent className="py-6">
                  <p className="text-sm text-poker-brown/60">{t.dashboard.totalSpent}</p>
                  <p className="text-3xl font-bold text-poker-brown">${dashboard.summary.totalSpent}</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-poker-gold">
                <CardContent className="py-6">
                  <p className="text-sm text-poker-brown/60">{t.dashboard.netResult}</p>
                  <p className={cn('text-3xl font-bold', getNetClass(dashboard.summary.overallNetResult))}>
                    ${formatMoney(dashboard.summary.overallNetResult)}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Group Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>{t.dashboard.resultsByGroup}</CardTitle>
                </CardHeader>
                <CardContent>
                  {dashboard.groupBreakdown.length === 0 ? (
                    <p className="text-poker-brown/60 text-center py-4">{t.dashboard.noGamesYet}</p>
                  ) : (
                    <div className="space-y-4">
                      {dashboard.groupBreakdown.map((group) => (
                        <Link
                          key={group.id}
                          href={`/groups/${group.id}`}
                          className="block p-4 border-2 border-poker-brown/10 rounded-lg hover:bg-poker-gold/10 hover:border-poker-gold/30 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-poker-brown">{group.name}</h4>
                              <p className="text-sm text-poker-brown/60">
                                {group.gamesPlayed} {t.dashboard.gamesPlayedCount}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className={cn('font-semibold', getNetClass(group.netResult))}>
                                ${formatMoney(group.netResult)}
                              </p>
                              <p className="text-xs text-poker-brown/60">
                                {t.dashboard.spent}: ${group.totalSpent}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Games */}
              <Card>
                <CardHeader>
                  <CardTitle>{t.dashboard.recentGames}</CardTitle>
                </CardHeader>
                <CardContent>
                  {dashboard.recentGames.length === 0 ? (
                    <p className="text-poker-brown/60 text-center py-4">{t.dashboard.noGamesYet}</p>
                  ) : (
                    <div className="space-y-3">
                      {dashboard.recentGames.map((game) => (
                        <Link
                          key={game.id}
                          href={`/groups/${game.groupId}/games/${game.id}`}
                          className="block p-3 border-2 border-poker-brown/10 rounded-lg hover:bg-poker-gold/10 hover:border-poker-gold/30 transition-colors"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm text-poker-brown/60">{formatDate(game.date)}</p>
                              <p className="font-medium text-poker-brown">{game.groupName}</p>
                              <span className="text-xs px-2 py-0.5 bg-poker-green/10 text-poker-green rounded">
                                {game.gameType === 'CASH' ? t.games.cashGame : t.games.tournament}
                              </span>
                            </div>
                            <div className="text-right">
                              <p className={cn('font-semibold', getNetClass(game.net))}>
                                ${formatMoney(game.net)}
                              </p>
                              <p className="text-xs text-poker-brown/60">
                                {game.spent} / {game.won}
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

            {dashboard.summary.totalGroups === 0 && (
              <div className="mt-8 text-center">
                <p className="text-poker-brown/70 mb-4">{t.dashboard.noGroupsYet}</p>
                <Link href="/groups">
                  <Button variant="gold">{t.dashboard.createOrJoin}</Button>
                </Link>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-poker-brown/70">{t.errors.failedToLoad}</p>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
