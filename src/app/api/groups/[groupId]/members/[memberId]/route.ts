import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { requireGroupAdmin, requireGroupOwner, canChangeRoles } from '@/lib/authorization';
import { updateMemberRoleSchema } from '@/lib/validations';
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/lib/api-response';
import { ZodError } from 'zod';
import { GroupRole } from '@prisma/client';

type RouteParams = { params: Promise<{ groupId: string; memberId: string }> };

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { groupId, memberId } = await params;
    const user = await requireAuth();

    // Only owner can change roles
    const userMembership = await requireGroupOwner(user.id, groupId);

    const body = await request.json();
    const validated = updateMemberRoleSchema.parse(body);

    // Get the target membership
    const targetMembership = await prisma.groupMembership.findUnique({
      where: { id: memberId },
    });

    if (!targetMembership || targetMembership.groupId !== groupId) {
      return notFoundResponse('Member not found');
    }

    // Cannot change owner's role
    if (targetMembership.role === GroupRole.OWNER) {
      return errorResponse('Cannot change the role of the group owner', 400);
    }

    // Cannot assign OWNER role through this endpoint
    if (!canChangeRoles(userMembership.role)) {
      return forbiddenResponse('Insufficient permissions');
    }

    const updated = await prisma.groupMembership.update({
      where: { id: memberId },
      data: { role: validated.role as GroupRole },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    return successResponse({
      member: {
        id: updated.id,
        userId: updated.user.id,
        email: updated.user.email,
        name: updated.user.name,
        role: updated.role,
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
    console.error('Update member role error:', error);
    return serverErrorResponse('Failed to update member role');
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { groupId, memberId } = await params;
    const user = await requireAuth();

    // Admin or owner can remove members
    const userMembership = await requireGroupAdmin(user.id, groupId);

    // Get the target membership
    const targetMembership = await prisma.groupMembership.findUnique({
      where: { id: memberId },
    });

    if (!targetMembership || targetMembership.groupId !== groupId) {
      return notFoundResponse('Member not found');
    }

    // Cannot remove the owner
    if (targetMembership.role === GroupRole.OWNER) {
      return errorResponse('Cannot remove the group owner', 400);
    }

    // Only owner can remove admins
    if (
      targetMembership.role === GroupRole.ADMIN &&
      userMembership.role !== GroupRole.OWNER
    ) {
      return forbiddenResponse('Only owner can remove admins');
    }

    // Users can remove themselves (leave group)
    const isSelf = targetMembership.userId === user.id;
    if (!isSelf && userMembership.role === GroupRole.MEMBER) {
      return forbiddenResponse('Insufficient permissions');
    }

    await prisma.groupMembership.delete({
      where: { id: memberId },
    });

    return successResponse({ message: 'Member removed successfully' });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') return unauthorizedResponse();
      if (error.message === 'Not a member of this group') return forbiddenResponse(error.message);
      if (error.message === 'Insufficient permissions') return forbiddenResponse(error.message);
    }
    console.error('Remove member error:', error);
    return serverErrorResponse('Failed to remove member');
  }
}
