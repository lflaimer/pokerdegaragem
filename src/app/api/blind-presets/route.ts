import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';

const blindLevelSchema = z.object({
  smallBlind: z.number().min(0),
  bigBlind: z.number().min(0),
  ante: z.number().min(0),
  durationMinutes: z.number().min(1),
});

const createPresetSchema = z.object({
  name: z.string().min(1).max(100),
  levels: z.array(blindLevelSchema).min(1),
});

// GET /api/blind-presets - List user's presets
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const presets = await prisma.blindPreset.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: { presets },
    });
  } catch (error) {
    console.error('Failed to fetch blind presets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch presets' },
      { status: 500 }
    );
  }
}

// POST /api/blind-presets - Create new preset
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = createPresetSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid preset data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { name, levels } = validation.data;

    const preset = await prisma.blindPreset.create({
      data: {
        userId: user.id,
        name,
        levels,
      },
    });

    return NextResponse.json({
      success: true,
      data: { preset },
    });
  } catch (error) {
    console.error('Failed to create blind preset:', error);
    return NextResponse.json(
      { error: 'Failed to create preset' },
      { status: 500 }
    );
  }
}
