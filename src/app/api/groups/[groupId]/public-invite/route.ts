import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { requireGroupAdmin } from '@/lib/authorization';
import { generateInviteToken } from '@/lib/utils';
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api-response';

type RouteParams = { params: Promise<{ groupId: string }> };

// Get current public invite link
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { groupId } = await params;
    const user = await requireAuth();

    await requireGroupAdmin(user.id, groupId);

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        publicInviteToken: true,
      },
    });

    if (!group) {
      return notFoundResponse('Group not found');
    }

    const inviteLink = group.publicInviteToken
      ? `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/join/${group.publicInviteToken}`
      : null;

    return successResponse({
      enabled: !!group.publicInviteToken,
      inviteLink,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') return unauthorizedResponse();
      if (error.message === 'Not a member of this group') return forbiddenResponse(error.message);
      if (error.message === 'Insufficient permissions') return forbiddenResponse(error.message);
    }
    console.error('Get public invite error:', error);
    return serverErrorResponse('Failed to get public invite');
  }
}

// Generate or regenerate public invite link
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { groupId } = await params;
    const user = await requireAuth();

    await requireGroupAdmin(user.id, groupId);

    const token = generateInviteToken();

    const group = await prisma.group.update({
      where: { id: groupId },
      data: { publicInviteToken: token },
      select: {
        id: true,
        publicInviteToken: true,
      },
    });

    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/join/${group.publicInviteToken}`;

    return successResponse({
      enabled: true,
      inviteLink,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') return unauthorizedResponse();
      if (error.message === 'Not a member of this group') return forbiddenResponse(error.message);
      if (error.message === 'Insufficient permissions') return forbiddenResponse(error.message);
    }
    console.error('Generate public invite error:', error);
    return serverErrorResponse('Failed to generate public invite');
  }
}

// Disable public invite link
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { groupId } = await params;
    const user = await requireAuth();

    await requireGroupAdmin(user.id, groupId);

    await prisma.group.update({
      where: { id: groupId },
      data: { publicInviteToken: null },
    });

    return successResponse({
      enabled: false,
      inviteLink: null,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') return unauthorizedResponse();
      if (error.message === 'Not a member of this group') return forbiddenResponse(error.message);
      if (error.message === 'Insufficient permissions') return forbiddenResponse(error.message);
    }
    console.error('Disable public invite error:', error);
    return serverErrorResponse('Failed to disable public invite');
  }
}
