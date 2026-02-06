import { removeAdminCookie } from '@/lib/admin-auth';
import { successResponse, serverErrorResponse } from '@/lib/api-response';

export async function POST() {
  try {
    await removeAdminCookie();
    return successResponse({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Admin logout error:', error);
    return serverErrorResponse('Failed to logout');
  }
}
