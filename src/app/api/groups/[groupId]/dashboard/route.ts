import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { requireGroupMembership } from '@/lib/authorization';
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  serverErrorResponse,
} from '@/lib/api-response';
import { Prisma } from '@prisma/client';

type RouteParams = { params: Promise<{ groupId: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { groupId } = await params;
    const user = await requireAuth();

    // Verify membership
    await requireGroupMembership(user.id, groupId);

    // Parse query params for filtering
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const dateFilter: Prisma.GameWhereInput = { groupId };
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) dateFilter.date.gte = new Date(startDate);
      if (endDate) dateFilter.date.lte = new Date(endDate);
    }

    // Get all games with participants for the period
    const games = await prisma.game.findMany({
      where: dateFilter,
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    // Calculate totals
    let totalSpent = new Prisma.Decimal(0);
    let totalWon = new Prisma.Decimal(0);

    // Track per-user stats
    const userStats: Record<
      string,
      {
        id: string;
        name: string;
        email: string;
        gamesPlayed: number;
        totalSpent: Prisma.Decimal;
        totalWon: Prisma.Decimal;
      }
    > = {};

    // Track guest stats
    const guestStats: Record<
      string,
      {
        name: string;
        gamesPlayed: number;
        totalSpent: Prisma.Decimal;
        totalWon: Prisma.Decimal;
      }
    > = {};

    for (const game of games) {
      for (const participant of game.participants) {
        totalSpent = totalSpent.plus(participant.spent);
        totalWon = totalWon.plus(participant.won);

        if (participant.userId && participant.user) {
          const uid = participant.userId;
          if (!userStats[uid]) {
            userStats[uid] = {
              id: participant.user.id,
              name: participant.user.name,
              email: participant.user.email,
              gamesPlayed: 0,
              totalSpent: new Prisma.Decimal(0),
              totalWon: new Prisma.Decimal(0),
            };
          }
          userStats[uid].gamesPlayed++;
          userStats[uid].totalSpent = userStats[uid].totalSpent.plus(participant.spent);
          userStats[uid].totalWon = userStats[uid].totalWon.plus(participant.won);
        } else if (participant.guestName) {
          const guestKey = participant.guestName.toLowerCase();
          if (!guestStats[guestKey]) {
            guestStats[guestKey] = {
              name: participant.guestName,
              gamesPlayed: 0,
              totalSpent: new Prisma.Decimal(0),
              totalWon: new Prisma.Decimal(0),
            };
          }
          guestStats[guestKey].gamesPlayed++;
          guestStats[guestKey].totalSpent = guestStats[guestKey].totalSpent.plus(participant.spent);
          guestStats[guestKey].totalWon = guestStats[guestKey].totalWon.plus(participant.won);
        }
      }
    }

    // Format user stats for response
    const playerStats = Object.values(userStats)
      .map((stat) => ({
        type: 'user' as const,
        id: stat.id,
        name: stat.name,
        email: stat.email,
        gamesPlayed: stat.gamesPlayed,
        totalSpent: stat.totalSpent.toFixed(2),
        totalWon: stat.totalWon.toFixed(2),
        netResult: stat.totalWon.minus(stat.totalSpent).toFixed(2),
      }))
      .sort((a, b) => parseFloat(b.netResult) - parseFloat(a.netResult));

    const guestPlayerStats = Object.values(guestStats)
      .map((stat) => ({
        type: 'guest' as const,
        name: stat.name,
        gamesPlayed: stat.gamesPlayed,
        totalSpent: stat.totalSpent.toFixed(2),
        totalWon: stat.totalWon.toFixed(2),
        netResult: stat.totalWon.minus(stat.totalSpent).toFixed(2),
      }))
      .sort((a, b) => parseFloat(b.netResult) - parseFloat(a.netResult));

    // Game type breakdown
    const cashGames = games.filter((g) => g.gameType === 'CASH');
    const tournaments = games.filter((g) => g.gameType === 'TOURNAMENT');

    return successResponse({
      dashboard: {
        period: {
          startDate: startDate || null,
          endDate: endDate || null,
        },
        summary: {
          totalGames: games.length,
          cashGames: cashGames.length,
          tournaments: tournaments.length,
          totalSpent: totalSpent.toFixed(2),
          totalWon: totalWon.toFixed(2),
          groupNetResult: totalWon.minus(totalSpent).toFixed(2),
        },
        playerStats: [...playerStats, ...guestPlayerStats],
        recentGames: games.slice(0, 10).map((game) => {
          const gameSpent = game.participants.reduce(
            (sum, p) => sum.plus(p.spent),
            new Prisma.Decimal(0)
          );
          const gameWon = game.participants.reduce(
            (sum, p) => sum.plus(p.won),
            new Prisma.Decimal(0)
          );
          return {
            id: game.id,
            date: game.date,
            gameType: game.gameType,
            participantCount: game.participants.length,
            totalSpent: gameSpent.toFixed(2),
            totalWon: gameWon.toFixed(2),
          };
        }),
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') return unauthorizedResponse();
      if (error.message === 'Not a member of this group') return forbiddenResponse(error.message);
    }
    console.error('Get group dashboard error:', error);
    return serverErrorResponse('Failed to get dashboard');
  }
}
