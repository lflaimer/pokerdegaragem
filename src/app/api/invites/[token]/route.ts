import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { respondToInviteSchema } from '@/lib/validations';
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/lib/api-response';
import { ZodError } from 'zod';
import { InviteStatus, GroupRole } from '@prisma/client';

type RouteParams = { params: Promise<{ token: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;

    const invite = await prisma.groupInvite.findUnique({
      where: { token },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            _count: {
              select: { memberships: true },
            },
          },
        },
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!invite) {
      return notFoundResponse('Invite not found');
    }

    const isExpired = invite.expiresAt < new Date();
    const isValid = invite.status === InviteStatus.PENDING && !isExpired;

    return successResponse({
      invite: {
        id: invite.id,
        inviteeEmail: invite.inviteeEmail,
        status: isExpired && invite.status === InviteStatus.PENDING ? 'EXPIRED' : invite.status,
        isValid,
        group: {
          id: invite.group.id,
          name: invite.group.name,
          memberCount: invite.group._count.memberships,
        },
        inviter: invite.inviter,
        expiresAt: invite.expiresAt,
        createdAt: invite.createdAt,
      },
    });
  } catch (error) {
    console.error('Get invite error:', error);
    return serverErrorResponse('Failed to get invite');
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return unauthorizedResponse('Please sign in to respond to this invite');
    }

    const body = await request.json();
    const validated = respondToInviteSchema.parse(body);

    const invite = await prisma.groupInvite.findUnique({
      where: { token },
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
      return notFoundResponse('Invite not found');
    }

    if (invite.status !== InviteStatus.PENDING) {
      return errorResponse('This invite has already been used', 400);
    }

    if (invite.expiresAt < new Date()) {
      await prisma.groupInvite.update({
        where: { id: invite.id },
        data: { status: InviteStatus.EXPIRED },
      });
      return errorResponse('This invite has expired', 400);
    }

    // For email-based invites, verify email matches (case-insensitive)
    // For in-app invites (inviteeId set), verify user ID matches
    if (invite.inviteeId) {
      if (invite.inviteeId !== user.id) {
        return errorResponse(
          'This invite was sent to a different user.',
          403
        );
      }
    } else if (invite.inviteeEmail) {
      if (invite.inviteeEmail.toLowerCase() !== user.email.toLowerCase()) {
        return errorResponse(
          'This invite was sent to a different email address. Please sign in with the correct account.',
          403
        );
      }
    }

    // Check if already a member
    const existingMembership = await prisma.groupMembership.findUnique({
      where: {
        groupId_userId: {
          groupId: invite.groupId,
          userId: user.id,
        },
      },
    });

    if (existingMembership) {
      return errorResponse('You are already a member of this group', 400);
    }

    if (validated.accept) {
      // Accept invite - create membership
      await prisma.$transaction([
        prisma.groupInvite.update({
          where: { id: invite.id },
          data: { status: InviteStatus.ACCEPTED },
        }),
        prisma.groupMembership.create({
          data: {
            groupId: invite.groupId,
            userId: user.id,
            role: GroupRole.MEMBER,
          },
        }),
      ]);

      return successResponse({
        message: 'Invite accepted',
        group: {
          id: invite.group.id,
          name: invite.group.name,
        },
      });
    } else {
      // Decline invite
      await prisma.groupInvite.update({
        where: { id: invite.id },
        data: { status: InviteStatus.DECLINED },
      });

      return successResponse({ message: 'Invite declined' });
    }
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }
    console.error('Respond to invite error:', error);
    return serverErrorResponse('Failed to respond to invite');
  }
}
