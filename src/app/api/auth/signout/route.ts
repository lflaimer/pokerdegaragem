import { removeAuthCookie } from '@/lib/auth';
import { successResponse, serverErrorResponse } from '@/lib/api-response';

export async function POST() {
  try {
    await removeAuthCookie();
    return successResponse({ message: 'Signed out successfully' });
  } catch (error) {
    console.error('Signout error:', error);
    return serverErrorResponse('Failed to sign out');
  }
}
