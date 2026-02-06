import { NextRequest } from 'next/server';
import {
  verifyAdminPassword,
  getAdminUsername,
  createAdminToken,
  setAdminCookie,
} from '@/lib/admin-auth';
import { adminLoginSchema } from '@/lib/validations';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/lib/api-response';
import { ZodError } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = adminLoginSchema.parse(body);

    const expectedUsername = getAdminUsername();
    if (validated.username !== expectedUsername) {
      return errorResponse('Invalid credentials', 401);
    }

    const isValid = await verifyAdminPassword(validated.password);
    if (!isValid) {
      return errorResponse('Invalid credentials', 401);
    }

    const token = await createAdminToken(validated.username);
    await setAdminCookie(token);

    return successResponse({
      admin: {
        username: validated.username,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }
    console.error('Admin login error:', error);
    return serverErrorResponse('Failed to login');
  }
}
