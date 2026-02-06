import { getCurrentAdmin } from '@/lib/admin-auth';
import { successResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api-response';

export async function GET() {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return unauthorizedResponse();
    }

    return successResponse({
      admin: {
        username: admin.username,
      },
    });
  } catch (error) {
    console.error('Admin me error:', error);
    return serverErrorResponse('Failed to get admin info');
  }
}
