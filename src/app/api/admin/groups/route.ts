import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/db';
import {
  successResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    const where = search
      ? {
          name: { contains: search },
        }
      : {};

    const [groups, total] = await Promise.all([
      prisma.group.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          createdAt: true,
          _count: {
            select: {
              memberships: true,
              games: true,
            },
          },
        },
      }),
      prisma.group.count({ where }),
    ]);

    const formattedGroups = groups.map((group) => ({
      id: group.id,
      name: group.name,
      createdAt: group.createdAt,
      memberCount: group._count.memberships,
      gameCount: group._count.games,
    }));

    return successResponse({
      groups: formattedGroups,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    console.error('Admin groups list error:', error);
    return serverErrorResponse('Failed to fetch groups');
  }
}
