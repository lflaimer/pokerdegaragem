import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { getUserGroups } from '@/lib/authorization';
import { createGroupSchema } from '@/lib/validations';
import {
  successResponse,
  unauthorizedResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/lib/api-response';
import { ZodError } from 'zod';
import { GroupRole } from '@prisma/client';

export async function GET() {
  try {
    const user = await requireAuth();
    const memberships = await getUserGroups(user.id);

    const groups = memberships.map((m) => ({
      id: m.group.id,
      name: m.group.name,
      role: m.role,
      memberCount: m.group._count.memberships,
      gameCount: m.group._count.games,
      createdAt: m.group.createdAt,
      joinedAt: m.createdAt,
    }));

    return successResponse({ groups });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    console.error('Get groups error:', error);
    return serverErrorResponse('Failed to get groups');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const validated = createGroupSchema.parse(body);

    // Create group and membership in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const group = await tx.group.create({
        data: {
          name: validated.name,
        },
      });

      await tx.groupMembership.create({
        data: {
          groupId: group.id,
          userId: user.id,
          role: GroupRole.OWNER,
        },
      });

      return group;
    });

    return successResponse(
      {
        group: {
          id: result.id,
          name: result.name,
          role: GroupRole.OWNER,
          createdAt: result.createdAt,
        },
      },
      201
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }
    console.error('Create group error:', error);
    return serverErrorResponse('Failed to create group');
  }
}
