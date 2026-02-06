import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { getUserGroups } from '@/lib/authorization';
import {
  successResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api-response';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Parse query params
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const groupId = searchParams.get('groupId');

    // Get user's groups
    const memberships = await getUserGroups(user.id);
    const groupIds = memberships.map((m) => m.groupId);

    if (groupIds.length === 0) {
      return successResponse({
        dashboard: {
          period: { startDate, endDate },
          summary: {
            totalGroups: 0,
            totalGamesPlayed: 0,
            totalSpent: '0.00',
            totalWon: '0.00',
            overallNetResult: '0.00',
          },
          groupBreakdown: [],
          recentGames: [],
        },
      });
    }

    // Build filter
    const dateFilter: Prisma.GameWhereInput = {
      groupId: groupId ? (groupIds.includes(groupId) ? groupId : { in: [] }) : { in: groupIds },
    };

    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) dateFilter.date.gte = new Date(startDate);
      if (endDate) dateFilter.date.lte = new Date(endDate);
    }

    // Get all games where user participated
    const games = await prisma.game.findMany({
      where: dateFilter,
      include: {
        group: {
          select: {
            id: true,
            name: true,
          },
        },
        participants: {
          where: {
            userId: user.id,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    // Filter to only games where user participated
    const userGames = games.filter((g) => g.participants.length > 0);

    // Calculate overall totals
    let totalSpent = new Prisma.Decimal(0);
    let totalWon = new Prisma.Decimal(0);

    // Track per-group stats
    const groupStats: Record<
      string,
      {
        id: string;
        name: string;
        gamesPlayed: number;
        totalSpent: Prisma.Decimal;
        totalWon: Prisma.Decimal;
      }
    > = {};

    for (const game of userGames) {
      const participation = game.participants[0];
      totalSpent = totalSpent.plus(participation.spent);
      totalWon = totalWon.plus(participation.won);

      const gid = game.groupId;
      if (!groupStats[gid]) {
        groupStats[gid] = {
          id: game.group.id,
          name: game.group.name,
          gamesPlayed: 0,
          totalSpent: new Prisma.Decimal(0),
          totalWon: new Prisma.Decimal(0),
        };
      }
      groupStats[gid].gamesPlayed++;
      groupStats[gid].totalSpent = groupStats[gid].totalSpent.plus(participation.spent);
      groupStats[gid].totalWon = groupStats[gid].totalWon.plus(participation.won);
    }

    // Format group breakdown
    const groupBreakdown = Object.values(groupStats)
      .map((stat) => ({
        id: stat.id,
        name: stat.name,
        gamesPlayed: stat.gamesPlayed,
        totalSpent: stat.totalSpent.toFixed(2),
        totalWon: stat.totalWon.toFixed(2),
        netResult: stat.totalWon.minus(stat.totalSpent).toFixed(2),
      }))
      .sort((a, b) => parseFloat(b.netResult) - parseFloat(a.netResult));

    // Recent games
    const recentGames = userGames.slice(0, 10).map((game) => ({
      id: game.id,
      groupId: game.group.id,
      groupName: game.group.name,
      date: game.date,
      gameType: game.gameType,
      spent: game.participants[0].spent.toFixed(2),
      won: game.participants[0].won.toFixed(2),
      net: game.participants[0].won.minus(game.participants[0].spent).toFixed(2),
    }));

    return successResponse({
      dashboard: {
        period: {
          startDate: startDate || null,
          endDate: endDate || null,
        },
        summary: {
          totalGroups: memberships.length,
          totalGamesPlayed: userGames.length,
          totalSpent: totalSpent.toFixed(2),
          totalWon: totalWon.toFixed(2),
          overallNetResult: totalWon.minus(totalSpent).toFixed(2),
        },
        groupBreakdown,
        recentGames,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    console.error('Get overall dashboard error:', error);
    return serverErrorResponse('Failed to get dashboard');
  }
}
