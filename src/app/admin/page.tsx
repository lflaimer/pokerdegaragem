'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDate } from '@/lib/utils';

interface Stats {
  totalUsers: number;
  totalGroups: number;
  totalGames: number;
  totalParticipants: number;
  recentActivity: {
    usersLast7Days: number;
    usersLast30Days: number;
    gamesLast7Days: number;
    gamesLast30Days: number;
  };
  topGroups: Array<{
    id: string;
    name: string;
    memberCount: number;
    gameCount: number;
  }>;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { t } = useLanguage();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/stats');
        if (!res.ok) throw new Error('Failed to fetch stats');
        const data = await res.json();
        setStats(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : t.errors.failedToLoad);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [t.errors.failedToLoad]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-poker-gold"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-poker-red/20 border border-poker-red text-poker-red p-4 rounded-lg">
        {error}
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    { label: t.admin.totalUsers, value: stats.totalUsers },
    { label: t.admin.totalGroups, value: stats.totalGroups },
    { label: t.admin.totalGames, value: stats.totalGames },
    { label: t.admin.totalParticipants, value: stats.totalParticipants },
  ];

  const activityItems = [
    { label: t.admin.usersLast7Days, value: stats.recentActivity.usersLast7Days },
    { label: t.admin.usersLast30Days, value: stats.recentActivity.usersLast30Days },
    { label: t.admin.gamesLast7Days, value: stats.recentActivity.gamesLast7Days },
    { label: t.admin.gamesLast30Days, value: stats.recentActivity.gamesLast30Days },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-white">{t.admin.dashboard}</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700"
          >
            <p className="text-gray-400 text-sm">{stat.label}</p>
            <p className="text-3xl font-bold text-poker-gold mt-2">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">
            {t.admin.recentActivity}
          </h2>
          <div className="space-y-4">
            {activityItems.map((item) => (
              <div
                key={item.label}
                className="flex justify-between items-center py-2 border-b border-gray-700 last:border-0"
              >
                <span className="text-gray-400">{item.label}</span>
                <span className="text-white font-semibold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Groups */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">
            {t.admin.topGroups}
          </h2>
          {stats.topGroups.length === 0 ? (
            <p className="text-gray-400">{t.admin.noResults}</p>
          ) : (
            <div className="space-y-3">
              {stats.topGroups.map((group) => (
                <div
                  key={group.id}
                  className="flex justify-between items-center py-2 border-b border-gray-700 last:border-0"
                >
                  <span className="text-white font-medium">{group.name}</span>
                  <div className="flex gap-4 text-sm">
                    <span className="text-gray-400">
                      {group.memberCount} {t.admin.memberCount}
                    </span>
                    <span className="text-gray-400">
                      {group.gameCount} {t.admin.gameCount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
