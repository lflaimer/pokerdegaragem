import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { requireGroupMembership } from '@/lib/authorization';
import { createGameSchema } from '@/lib/validations';
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/lib/api-response';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

type RouteParams = { params: Promise<{ groupId: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { groupId } = await params;
    const user = await requireAuth();

    // Verify membership
    await requireGroupMembership(user.id, groupId);

    // Parse query params for filtering
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const gameType = searchParams.get('gameType');

    const where: Prisma.GameWhereInput = { groupId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    if (gameType && (gameType === 'CASH' || gameType === 'TOURNAMENT')) {
      where.gameType = gameType;
    }

    const games = await prisma.game.findMany({
      where,
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
      },
      orderBy: { date: 'desc' },
    });

    const formattedGames = games.map((game) => {
      const totalSpent = game.participants.reduce(
        (sum, p) => sum.plus(p.spent),
        new Prisma.Decimal(0)
      );
      const totalWon = game.participants.reduce(
        (sum, p) => sum.plus(p.won),
        new Prisma.Decimal(0)
      );

      return {
        id: game.id,
        date: game.date,
        gameType: game.gameType,
        notes: game.notes,
        participantCount: game.participants.length,
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
        createdAt: game.createdAt,
      };
    });

    return successResponse({ games: formattedGames });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') return unauthorizedResponse();
      if (error.message === 'Not a member of this group') return forbiddenResponse(error.message);
    }
    console.error('Get games error:', error);
    return serverErrorResponse('Failed to get games');
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { groupId } = await params;
    const user = await requireAuth();

    // Verify membership
    await requireGroupMembership(user.id, groupId);

    const body = await request.json();
    const validated = createGameSchema.parse(body);

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

    // Create game with participants
    const game = await prisma.game.create({
      data: {
        groupId,
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

    const totalSpent = game.participants.reduce(
      (sum, p) => sum.plus(p.spent),
      new Prisma.Decimal(0)
    );
    const totalWon = game.participants.reduce(
      (sum, p) => sum.plus(p.won),
      new Prisma.Decimal(0)
    );

    return successResponse(
      {
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
          createdAt: game.createdAt,
        },
      },
      201
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') return unauthorizedResponse();
      if (error.message === 'Not a member of this group') return forbiddenResponse(error.message);
    }
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }
    console.error('Create game error:', error);
    return serverErrorResponse('Failed to create game');
  }
}
