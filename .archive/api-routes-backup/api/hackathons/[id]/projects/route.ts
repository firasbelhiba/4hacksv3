import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ProjectCreateSchema } from '@/lib/validations/project';
import { generateProjectSlug } from '@/lib/validations/project';
import type { ApiResponse, PaginatedResponse } from '@/types/database';

// GET /api/hackathons/[id]/projects - List projects for hackathon
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

    const hackathonId = params.id;
    const { searchParams } = new URL(request.url);

    // Simple filtering
    const filters = {
      trackId: searchParams.get('trackId'),
      status: searchParams.get('status'),
      search: searchParams.get('search'),
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
    };

    // Verify hackathon exists and user has access
    const hackathon = await prisma.hackathon.findFirst({
      where: {
        id: hackathonId,
        createdById: session.user.id,
      },
    });

    if (!hackathon) {
      return NextResponse.json(
        { success: false, error: 'Hackathon not found or access denied' },
        { status: 404 }
      );
    }

    // Build where clause
    const where: any = {
      hackathonId,
    };

    if (filters.trackId) {
      where.trackId = filters.trackId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { teamName: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Get projects with track and hackathon info
    const projects = await prisma.project.findMany({
      where,
      take: filters.limit,
      skip: filters.offset,
      orderBy: { createdAt: 'desc' },
      include: {
        track: {
          select: {
            id: true,
            name: true,
          },
        },
        hackathon: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Get total count for pagination
    const totalCount = await prisma.project.count({ where });

    const response: PaginatedResponse = {
      success: true,
      data: projects,
      pagination: {
        total: totalCount,
        limit: filters.limit,
        offset: filters.offset,
        hasMore: totalCount > filters.offset + filters.limit,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/hackathons/[id]/projects - Create new project
export async function POST(
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

    const hackathonId = params.id;
    const body = await request.json();

    // Add hackathonId to the data for validation
    const projectData = {
      ...body,
      hackathonId,
    };

    // Validate the project data
    const validatedData = ProjectCreateSchema.safeParse(projectData);
    if (!validatedData.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid project data',
          details: validatedData.error.issues
        },
        { status: 400 }
      );
    }

    const data = validatedData.data;

    // Verify hackathon exists and user has access
    const hackathon = await prisma.hackathon.findFirst({
      where: {
        id: hackathonId,
        createdById: session.user.id,
      },
      include: {
        tracks: {
          select: { id: true },
        },
      },
    });

    if (!hackathon) {
      return NextResponse.json(
        { success: false, error: 'Hackathon not found or access denied' },
        { status: 404 }
      );
    }

    // Verify track exists in this hackathon
    const trackExists = hackathon.tracks.some(track => track.id === data.trackId);
    if (!trackExists) {
      return NextResponse.json(
        { success: false, error: 'Track not found in this hackathon' },
        { status: 400 }
      );
    }

    // Generate unique slug
    let slug = generateProjectSlug(data.name, data.teamName);
    let counter = 1;

    while (await prisma.project.findFirst({
      where: { hackathonId, slug },
    })) {
      slug = `${generateProjectSlug(data.name, data.teamName)}-${counter}`;
      counter++;
    }

    // Check for duplicate project name in the same hackathon
    const existingProject = await prisma.project.findFirst({
      where: {
        hackathonId,
        name: {
          equals: data.name,
          mode: 'insensitive',
        },
      },
    });

    if (existingProject) {
      return NextResponse.json(
        { success: false, error: 'A project with this name already exists in this hackathon' },
        { status: 409 }
      );
    }

    // Create the project
    const project = await prisma.project.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        teamName: data.teamName,
        teamMembers: data.teamMembers,
        githubUrl: data.githubUrl,
        demoUrl: data.demoUrl || null,
        videoUrl: data.videoUrl || null,
        presentationUrl: data.presentationUrl || null,
        hackathonId,
        trackId: data.trackId,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
      include: {
        track: {
          select: {
            id: true,
            name: true,
          },
        },
        hackathon: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const response: ApiResponse = {
      success: true,
      data: project,
      message: 'Project created successfully',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);

    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { success: false, error: 'A project with this name already exists' },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}