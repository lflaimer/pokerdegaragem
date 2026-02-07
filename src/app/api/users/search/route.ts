import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q')?.trim() || '';
    const groupId = searchParams.get('groupId');

    if (query.length < 2) {
      return successResponse({ users: [] });
    }

    // Get users to exclude (current group members and users with pending invites)
    let excludeUserIds: string[] = [user.id];

    if (groupId) {
      const groupMembers = await prisma.groupMembership.findMany({
        where: { groupId },
        select: { userId: true },
      });
      excludeUserIds = [...excludeUserIds, ...groupMembers.map((m) => m.userId)];

      // Also exclude users with pending in-app invites
      const pendingInvites = await prisma.groupInvite.findMany({
        where: {
          groupId,
          status: 'PENDING',
          inviteeId: { not: null },
          expiresAt: { gt: new Date() },
        },
        select: { inviteeId: true },
      });
      excludeUserIds = [
        ...excludeUserIds,
        ...pendingInvites.map((i) => i.inviteeId).filter((id): id is string => id !== null),
      ];
    }

    const users = await prisma.user.findMany({
      where: {
        id: { notIn: excludeUserIds },
        OR: [
          { name: { contains: query } },
          { email: { contains: query } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      take: 10,
      orderBy: { name: 'asc' },
    });

    return successResponse({ users });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    console.error('User search error:', error);
    return serverErrorResponse('Failed to search users');
  }
}
