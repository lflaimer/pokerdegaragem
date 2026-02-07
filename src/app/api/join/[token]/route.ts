import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api-response';

type RouteParams = { params: Promise<{ token: string }> };

// Get group info from public invite token
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;

    const group = await prisma.group.findUnique({
      where: { publicInviteToken: token },
      select: {
        id: true,
        name: true,
        _count: {
          select: { memberships: true },
        },
      },
    });

    if (!group) {
      return notFoundResponse('Invalid invite link');
    }

    return successResponse({
      group: {
        id: group.id,
        name: group.name,
        memberCount: group._count.memberships,
      },
    });
  } catch (error) {
    console.error('Get public invite info error:', error);
    return serverErrorResponse('Failed to get invite info');
  }
}

// Join group using public invite token
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;

    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse('Please sign in to join the group');
    }

    const group = await prisma.group.findUnique({
      where: { publicInviteToken: token },
      select: {
        id: true,
        name: true,
      },
    });

    if (!group) {
      return notFoundResponse('Invalid invite link');
    }

    // Check if already a member
    const existingMembership = await prisma.groupMembership.findUnique({
      where: {
        groupId_userId: {
          groupId: group.id,
          userId: user.id,
        },
      },
    });

    if (existingMembership) {
      return errorResponse('You are already a member of this group', 400);
    }

    // Create membership
    await prisma.groupMembership.create({
      data: {
        groupId: group.id,
        userId: user.id,
        role: 'MEMBER',
      },
    });

    return successResponse({
      message: 'Successfully joined the group',
      group: {
        id: group.id,
        name: group.name,
      },
    });
  } catch (error) {
    console.error('Join group error:', error);
    return serverErrorResponse('Failed to join group');
  }
}
