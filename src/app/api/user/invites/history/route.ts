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

    // Get completed invites for this user (accepted, declined, expired)
    const invites = await prisma.groupInvite.findMany({
      where: {
        inviteeId: user.id,
        status: { in: ['ACCEPTED', 'DECLINED', 'EXPIRED'] },
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
      take: 50,
    });

    return successResponse({
      invites: invites.map((invite) => ({
        id: invite.id,
        group: invite.group,
        inviter: invite.inviter,
        status: invite.status,
        createdAt: invite.createdAt,
      })),
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    console.error('Get invite history error:', error);
    return serverErrorResponse('Failed to get invite history');
  }
}
