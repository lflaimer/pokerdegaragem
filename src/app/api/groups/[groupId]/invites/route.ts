import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { requireGroupAdmin, requireGroupMembership } from '@/lib/authorization';
import { createInviteSchema } from '@/lib/validations';
import { generateInviteToken, getInviteExpirationDate } from '@/lib/utils';
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/lib/api-response';
import { ZodError } from 'zod';
import { InviteStatus } from '@prisma/client';

type RouteParams = { params: Promise<{ groupId: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { groupId } = await params;
    const user = await requireAuth();

    // Any member can view invites
    await requireGroupMembership(user.id, groupId);

    const invites = await prisma.groupInvite.findMany({
      where: {
        groupId,
        status: InviteStatus.PENDING,
      },
      include: {
        inviter: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse({
      invites: invites.map((i) => ({
        id: i.id,
        inviteeEmail: i.inviteeEmail,
        inviter: i.inviter,
        status: i.status,
        token: i.token,
        expiresAt: i.expiresAt,
        createdAt: i.createdAt,
      })),
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') return unauthorizedResponse();
      if (error.message === 'Not a member of this group') return forbiddenResponse(error.message);
    }
    console.error('Get invites error:', error);
    return serverErrorResponse('Failed to get invites');
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { groupId } = await params;
    const user = await requireAuth();

    // Only admin or owner can create invites
    await requireGroupAdmin(user.id, groupId);

    const body = await request.json();
    const validated = createInviteSchema.parse(body);
    const inviteeEmail = validated.inviteeEmail.toLowerCase();

    // Check if user is already a member
    const existingUser = await prisma.user.findUnique({
      where: { email: inviteeEmail },
    });

    if (existingUser) {
      const existingMembership = await prisma.groupMembership.findUnique({
        where: {
          groupId_userId: {
            groupId,
            userId: existingUser.id,
          },
        },
      });

      if (existingMembership) {
        return errorResponse('User is already a member of this group', 400);
      }
    }

    // Check for existing pending invite
    const existingInvite = await prisma.groupInvite.findFirst({
      where: {
        groupId,
        inviteeEmail,
        status: InviteStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvite) {
      return errorResponse('A pending invite already exists for this email', 400);
    }

    // Create invite
    const invite = await prisma.groupInvite.create({
      data: {
        groupId,
        inviterId: user.id,
        inviteeEmail,
        token: generateInviteToken(),
        expiresAt: getInviteExpirationDate(7),
      },
      include: {
        inviter: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        group: {
          select: {
            name: true,
          },
        },
      },
    });

    // In production, send email here
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invites/${invite.token}`;

    return successResponse(
      {
        invite: {
          id: invite.id,
          inviteeEmail: invite.inviteeEmail,
          inviter: invite.inviter,
          groupName: invite.group.name,
          token: invite.token,
          inviteLink,
          expiresAt: invite.expiresAt,
          createdAt: invite.createdAt,
        },
      },
      201
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') return unauthorizedResponse();
      if (error.message === 'Not a member of this group') return forbiddenResponse(error.message);
      if (error.message === 'Insufficient permissions') return forbiddenResponse(error.message);
    }
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }
    console.error('Create invite error:', error);
    return serverErrorResponse('Failed to create invite');
  }
}
