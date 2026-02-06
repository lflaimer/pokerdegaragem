import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { requireGroupMembership, requireGroupOwner } from '@/lib/authorization';
import { updateGroupSchema } from '@/lib/validations';
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/lib/api-response';
import { ZodError } from 'zod';

type RouteParams = { params: Promise<{ groupId: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { groupId } = await params;
    const user = await requireAuth();

    // Verify membership
    const membership = await requireGroupMembership(user.id, groupId);

    // Get group with members and game count
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
          orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
        },
        _count: {
          select: {
            games: true,
          },
        },
      },
    });

    if (!group) {
      return notFoundResponse('Group not found');
    }

    return successResponse({
      group: {
        id: group.id,
        name: group.name,
        createdAt: group.createdAt,
        gameCount: group._count.games,
        currentUserRole: membership.role,
        members: group.memberships.map((m) => ({
          id: m.id,
          userId: m.user.id,
          email: m.user.email,
          name: m.user.name,
          role: m.role,
          joinedAt: m.createdAt,
        })),
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') return unauthorizedResponse();
      if (error.message === 'Not a member of this group') return forbiddenResponse(error.message);
    }
    console.error('Get group error:', error);
    return serverErrorResponse('Failed to get group');
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { groupId } = await params;
    const user = await requireAuth();

    // Only owner can update group
    await requireGroupOwner(user.id, groupId);

    const body = await request.json();
    const validated = updateGroupSchema.parse(body);

    const group = await prisma.group.update({
      where: { id: groupId },
      data: {
        name: validated.name,
      },
    });

    return successResponse({
      group: {
        id: group.id,
        name: group.name,
        updatedAt: group.updatedAt,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') return unauthorizedResponse();
      if (error.message === 'Not a member of this group') return forbiddenResponse(error.message);
      if (error.message === 'Only group owner can perform this action')
        return forbiddenResponse(error.message);
    }
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }
    console.error('Update group error:', error);
    return serverErrorResponse('Failed to update group');
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { groupId } = await params;
    const user = await requireAuth();

    // Only owner can delete group
    await requireGroupOwner(user.id, groupId);

    await prisma.group.delete({
      where: { id: groupId },
    });

    return successResponse({ message: 'Group deleted successfully' });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') return unauthorizedResponse();
      if (error.message === 'Not a member of this group') return forbiddenResponse(error.message);
      if (error.message === 'Only group owner can perform this action')
        return forbiddenResponse(error.message);
    }
    console.error('Delete group error:', error);
    return serverErrorResponse('Failed to delete group');
  }
}
