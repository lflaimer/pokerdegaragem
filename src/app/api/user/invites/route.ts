import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import {
  successResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api-response';

export async function GET() {
  try {
    const user = await requireAuth();

    // Get pending invites for this user (in-app invites via inviteeId)
    const invites = await prisma.groupInvite.findMany({
      where: {
        inviteeId: user.id,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
          },
        },
        inviter: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Count unseen invites
    const unseenCount = invites.filter((invite) => !invite.seenAt).length;

    return successResponse({
      invites: invites.map((invite) => ({
        id: invite.id,
        group: invite.group,
        inviter: invite.inviter,
        seenAt: invite.seenAt,
        expiresAt: invite.expiresAt,
        createdAt: invite.createdAt,
      })),
      unseenCount,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    console.error('Get user invites error:', error);
    return serverErrorResponse('Failed to get invites');
  }
}
