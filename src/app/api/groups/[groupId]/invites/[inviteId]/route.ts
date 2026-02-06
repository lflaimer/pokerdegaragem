import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { requireGroupAdmin } from '@/lib/authorization';
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api-response';
import { InviteStatus } from '@prisma/client';

type RouteParams = { params: Promise<{ groupId: string; inviteId: string }> };

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { groupId, inviteId } = await params;
    const user = await requireAuth();

    // Only admin or owner can cancel invites
    await requireGroupAdmin(user.id, groupId);

    const invite = await prisma.groupInvite.findUnique({
      where: { id: inviteId },
    });

    if (!invite || invite.groupId !== groupId) {
      return notFoundResponse('Invite not found');
    }

    if (invite.status !== InviteStatus.PENDING) {
      return notFoundResponse('Invite is no longer pending');
    }

    await prisma.groupInvite.delete({
      where: { id: inviteId },
    });

    return successResponse({ message: 'Invite cancelled successfully' });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') return unauthorizedResponse();
      if (error.message === 'Not a member of this group') return forbiddenResponse(error.message);
      if (error.message === 'Insufficient permissions') return forbiddenResponse(error.message);
    }
    console.error('Cancel invite error:', error);
    return serverErrorResponse('Failed to cancel invite');
  }
}
