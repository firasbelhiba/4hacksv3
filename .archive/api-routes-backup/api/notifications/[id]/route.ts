import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import type { ApiResponse } from '@/types/database';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const notificationId = params.id;
    const userId = session.user.id;

    // Check if notification exists and belongs to user
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      return NextResponse.json(
        { success: false, error: 'Notification not found' },
        { status: 404 }
      );
    }

    await prisma.notification.delete({
      where: {
        id: notificationId,
      },
    });

    const response: ApiResponse<void> = {
      success: true,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Delete notification error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}