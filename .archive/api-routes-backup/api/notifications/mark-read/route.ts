import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import type { ApiResponse } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { notificationIds } = body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json(
        { success: false, error: 'Invalid notification IDs' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId,
      },
      data: {
        read: true,
        updatedAt: new Date(),
      },
    });

    const response: ApiResponse<void> = {
      success: true,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Mark notifications as read error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}