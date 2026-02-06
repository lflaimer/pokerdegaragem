import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/db';
import {
  successResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api-response';

export async function GET() {
  try {
    await requireAdmin();

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalGroups,
      totalGames,
      totalParticipants,
      usersLast7Days,
      usersLast30Days,
      gamesLast7Days,
      gamesLast30Days,
      topGroupsRaw,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.group.count(),
      prisma.game.count(),
      prisma.gameParticipant.count(),
      prisma.user.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
      prisma.user.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.game.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
      prisma.game.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.group.findMany({
        take: 5,
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              memberships: true,
              games: true,
            },
          },
        },
        orderBy: {
          games: {
            _count: 'desc',
          },
        },
      }),
    ]);

    const topGroups = topGroupsRaw.map((group) => ({
      id: group.id,
      name: group.name,
      memberCount: group._count.memberships,
      gameCount: group._count.games,
    }));

    return successResponse({
      totalUsers,
      totalGroups,
      totalGames,
      totalParticipants,
      recentActivity: {
        usersLast7Days,
        usersLast30Days,
        gamesLast7Days,
        gamesLast30Days,
      },
      topGroups,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    console.error('Admin stats error:', error);
    return serverErrorResponse('Failed to fetch statistics');
  }
}
