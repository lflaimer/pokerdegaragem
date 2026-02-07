import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import {
  successResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api-response';

export async function POST() {
  try {
    const user = await requireAuth();

    // Mark all unseen invites as seen
    await prisma.groupInvite.updateMany({
      where: {
        inviteeId: user.id,
        status: 'PENDING',
        seenAt: null,
      },
      data: {
        seenAt: new Date(),
      },
    });

    return successResponse({ message: 'Invites marked as seen' });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    console.error('Mark invites seen error:', error);
    return serverErrorResponse('Failed to mark invites as seen');
  }
}
