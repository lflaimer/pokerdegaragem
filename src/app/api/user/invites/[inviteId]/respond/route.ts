import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { respondToInviteSchema } from '@/lib/validations';
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  serverErrorResponse,
  validationErrorResponse,
} from '@/lib/api-response';
import { ZodError } from 'zod';

type RouteParams = { params: Promise<{ inviteId: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { inviteId } = await params;
    const user = await requireAuth();

    const body = await request.json();
    const validated = respondToInviteSchema.parse(body);

    // Find the invite
    const invite = await prisma.groupInvite.findUnique({
      where: { id: inviteId },
      include: {
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!invite) {
      return errorResponse('Invite not found', 404);
    }

    // Verify this invite belongs to the current user
    if (invite.inviteeId !== user.id) {
      return errorResponse('Invite not found', 404);
    }

    // Check if invite is still valid
    if (invite.status !== 'PENDING') {
      return errorResponse('Invite is no longer valid', 400);
    }

    if (invite.expiresAt < new Date()) {
      await prisma.groupInvite.update({
        where: { id: inviteId },
        data: { status: 'EXPIRED' },
      });
      return errorResponse('Invite has expired', 400);
    }

    if (validated.accept) {
      // Check if user is already a member
      const existingMembership = await prisma.groupMembership.findUnique({
        where: {
          groupId_userId: {
            groupId: invite.groupId,
            userId: user.id,
          },
        },
      });

      if (existingMembership) {
        await prisma.groupInvite.update({
          where: { id: inviteId },
          data: { status: 'ACCEPTED' },
        });
        return errorResponse('You are already a member of this group', 400);
      }

      // Accept the invite - create membership and update invite
      await prisma.$transaction([
        prisma.groupMembership.create({
          data: {
            groupId: invite.groupId,
            userId: user.id,
            role: 'MEMBER',
          },
        }),
        prisma.groupInvite.update({
          where: { id: inviteId },
          data: { status: 'ACCEPTED' },
        }),
      ]);

      return successResponse({
        message: 'Invite accepted',
        group: invite.group,
      });
    } else {
      // Decline the invite
      await prisma.groupInvite.update({
        where: { id: inviteId },
        data: { status: 'DECLINED' },
      });

      return successResponse({
        message: 'Invite declined',
      });
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }
    console.error('Respond to invite error:', error);
    return serverErrorResponse('Failed to respond to invite');
  }
}
