import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { requireGroupMembership } from '@/lib/authorization';
import { updateGameSchema } from '@/lib/validations';
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/lib/api-response';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

type RouteParams = { params: Promise<{ groupId: string; gameId: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { groupId, gameId } = await params;
    const user = await requireAuth();

    // Verify membership
    await requireGroupMembership(user.id, groupId);

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!game || game.groupId !== groupId) {
      return notFoundResponse('Game not found');
    }

    const totalSpent = game.participants.reduce(
      (sum, p) => sum.plus(p.spent),
      new Prisma.Decimal(0)
    );
    const totalWon = game.participants.reduce(
      (sum, p) => sum.plus(p.won),
      new Prisma.Decimal(0)
    );

    return successResponse({
      game: {
        id: game.id,
        groupId: game.groupId,
        groupName: game.group.name,
        date: game.date,
        gameType: game.gameType,
        notes: game.notes,
        totalSpent: totalSpent.toFixed(2),
        totalWon: totalWon.toFixed(2),
        participants: game.participants.map((p) => ({
          id: p.id,
          userId: p.userId,
          userName: p.user?.name || null,
          userEmail: p.user?.email || null,
          guestName: p.guestName,
          spent: p.spent.toFixed(2),
          won: p.won.toFixed(2),
          net: p.won.minus(p.spent).toFixed(2),
        })),
        createdAt: game.createdAt,
        updatedAt: game.updatedAt,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') return unauthorizedResponse();
      if (error.message === 'Not a member of this group') return forbiddenResponse(error.message);
    }
    console.error('Get game error:', error);
    return serverErrorResponse('Failed to get game');
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { groupId, gameId } = await params;
    const user = await requireAuth();

    // Verify membership
    await requireGroupMembership(user.id, groupId);

    // Verify game exists and belongs to group
    const existingGame = await prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!existingGame || existingGame.groupId !== groupId) {
      return notFoundResponse('Game not found');
    }

    const body = await request.json();
    const validated = updateGameSchema.parse(body);

    // Validate participants
    const userIds = validated.participants
      .filter((p) => p.userId)
      .map((p) => p.userId as string);

    // Check for duplicate user participants
    const uniqueUserIds = new Set(userIds);
    if (uniqueUserIds.size !== userIds.length) {
      return errorResponse('Duplicate user participants are not allowed', 400);
    }

    // Verify all user participants are group members
    if (userIds.length > 0) {
      const memberships = await prisma.groupMembership.findMany({
        where: {
          groupId,
          userId: { in: userIds },
        },
      });

      if (memberships.length !== userIds.length) {
        return errorResponse('All user participants must be group members', 400);
      }
    }

    // Update game with participants in transaction
    const game = await prisma.$transaction(async (tx) => {
      // Delete existing participants
      await tx.gameParticipant.deleteMany({
        where: { gameId },
      });

      // Update game and create new participants
      return tx.game.update({
        where: { id: gameId },
        data: {
          date: new Date(validated.date),
          gameType: validated.gameType,
          notes: validated.notes,
          participants: {
            create: validated.participants.map((p) => ({
              userId: p.userId || null,
              guestName: p.guestName || null,
              spent: new Prisma.Decimal(p.spent),
              won: new Prisma.Decimal(p.won),
            })),
          },
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });
    });

    const totalSpent = game.participants.reduce(
      (sum, p) => sum.plus(p.spent),
      new Prisma.Decimal(0)
    );
    const totalWon = game.participants.reduce(
      (sum, p) => sum.plus(p.won),
      new Prisma.Decimal(0)
    );

    return successResponse({
      game: {
        id: game.id,
        date: game.date,
        gameType: game.gameType,
        notes: game.notes,
        totalSpent: totalSpent.toFixed(2),
        totalWon: totalWon.toFixed(2),
        participants: game.participants.map((p) => ({
          id: p.id,
          userId: p.userId,
          userName: p.user?.name || null,
          guestName: p.guestName,
          spent: p.spent.toFixed(2),
          won: p.won.toFixed(2),
          net: p.won.minus(p.spent).toFixed(2),
        })),
        updatedAt: game.updatedAt,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') return unauthorizedResponse();
      if (error.message === 'Not a member of this group') return forbiddenResponse(error.message);
    }
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }
    console.error('Update game error:', error);
    return serverErrorResponse('Failed to update game');
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { groupId, gameId } = await params;
    const user = await requireAuth();

    // Verify membership
    await requireGroupMembership(user.id, groupId);

    // Verify game exists and belongs to group
    const game = await prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!game || game.groupId !== groupId) {
      return notFoundResponse('Game not found');
    }

    await prisma.game.delete({
      where: { id: gameId },
    });

    return successResponse({ message: 'Game deleted successfully' });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') return unauthorizedResponse();
      if (error.message === 'Not a member of this group') return forbiddenResponse(error.message);
    }
    console.error('Delete game error:', error);
    return serverErrorResponse('Failed to delete game');
  }
}
