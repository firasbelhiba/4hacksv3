import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import type { ApiResponse } from '@/types/database';

// GET /api/projects/[id] - Get a single project by ID
export async function GET(
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

    const projectId = params.id;

    // Fetch project with user access validation
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        hackathon: {
          createdById: session.user.id,
        },
      },
      include: {
        hackathon: {
          select: { id: true, name: true, createdById: true },
        },
        track: {
          select: { id: true, name: true },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    const response: ApiResponse = {
      success: true,
      data: { project },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}