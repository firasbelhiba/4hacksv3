import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { TracksSchema } from '@/lib/validations/hackathon';
import type { ApiResponse } from '@/types/database';

// GET /api/hackathons/[id]/tracks - List tracks for hackathon
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
    const filterData = Object.fromEntries(searchParams.entries());

    // Simple filtering without complex validation
    const filters = {
      query: filterData.query,
      hasProjects: filterData.hasProjects === 'true',
      sortBy: filterData.sortBy || 'order',
      sortOrder: filterData.sortOrder || 'asc',
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

    if (filters.query) {
      where.OR = [
        { name: { contains: filters.query, mode: 'insensitive' } },
        { description: { contains: filters.query, mode: 'insensitive' } },
      ];
    }

    // Note: isDefault field removed as it doesn't exist in current schema
    // if (filters.isDefault !== undefined) {
    //   where.isDefault = filters.isDefault;
    // }

    // Get tracks with project counts
    let tracks = await prisma.track.findMany({
      where,
      orderBy: filters.sortBy === 'projectCount'
        ? undefined
        : { [filters.sortBy]: filters.sortOrder },
      include: {
        _count: {
          select: {
            projects: true,
          },
        },
      },
    });

    // Apply additional filters that require computed values
    if (filters.hasProjects !== undefined) {
      tracks = tracks.filter(track =>
        filters.hasProjects ? track._count.projects > 0 : track._count.projects === 0
      );
    }

    // Note: minParticipants and maxParticipants filters removed as they don't exist in current schema

    // Sort by project count if requested
    if (filters.sortBy === 'projectCount') {
      tracks.sort((a, b) => {
        const diff = a._count.projects - b._count.projects;
        return filters.sortOrder === 'desc' ? -diff : diff;
      });
    }

    const response: ApiResponse = {
      success: true,
      data: tracks,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching tracks:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/hackathons/[id]/tracks - Create new track
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

    const trackData = body;

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

    // Check if track name is unique within hackathon
    const existingTrack = await prisma.track.findFirst({
      where: {
        hackathonId,
        name: {
          equals: trackData.name,
          mode: 'insensitive',
        },
      },
    });

    if (existingTrack) {
      return NextResponse.json(
        { success: false, error: 'A track with this name already exists in this hackathon' },
        { status: 409 }
      );
    }

    // Note: isDefault field removed as it doesn't exist in current schema
    // if (trackData.isDefault) {
    //   await prisma.track.updateMany({
    //     where: {
    //       hackathonId,
    //       isDefault: true,
    //     },
    //     data: {
    //       isDefault: false,
    //     },
    //   });
    // }

    // Get the next order number if not provided
    let order = trackData.order;
    if (order === undefined || order === 0) {
      const maxOrder = await prisma.track.aggregate({
        where: { hackathonId },
        _max: { order: true },
      });
      order = (maxOrder._max.order || 0) + 1;
    }

    // Create the track
    const track = await prisma.track.create({
      data: {
        name: trackData.name,
        description: trackData.description,
        prize: trackData.prize,
        order,
        eligibilityCriteria: trackData.eligibilityCriteria ?
          { criteria: trackData.eligibilityCriteria } : undefined,
        // Note: color, icon, isDefault fields removed as they don't exist in current schema
        hackathonId,
      },
      include: {
        _count: {
          select: {
            projects: true,
          },
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE_TRACK',
        entityType: 'Track',
        entityId: track.id,
        metadata: {
          trackName: track.name,
          hackathonId,
          hackathonName: hackathon.name,
        },
      },
    });

    const response: ApiResponse = {
      success: true,
      data: track,
      message: 'Track created successfully',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating track:', error);

    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { success: false, error: 'A track with this name already exists' },
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

// PUT /api/hackathons/[id]/tracks - Fast batch update of all tracks
export async function PUT(
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

    // Validate the tracks data
    const validatedData = TracksSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid tracks data',
          details: validatedData.error.issues
        },
        { status: 400 }
      );
    }

    // Check if hackathon exists and user has permission - fast query
    const hackathon = await prisma.hackathon.findFirst({
      where: {
        id: hackathonId,
        createdById: session.user.id,
      },
      select: { id: true } // Only select what we need
    });

    if (!hackathon) {
      return NextResponse.json(
        { success: false, error: 'Hackathon not found or access denied' },
        { status: 404 }
      );
    }

    const { tracks } = validatedData.data;

    // Simple, fast approach - no complex transactions
    // Just update what exists and create what's new
    const tracksToUpdate = tracks.filter(track => track.id);
    const tracksToCreate = tracks.filter(track => !track.id);

    // Update existing tracks in parallel for speed
    if (tracksToUpdate.length > 0) {
      await Promise.all(
        tracksToUpdate.map(track =>
          prisma.track.update({
            where: { id: track.id },
            data: {
              name: track.name,
              description: track.description,
              prize: track.prize,
              order: track.order,
              eligibilityCriteria: track.eligibilityCriteria ?
                { criteria: track.eligibilityCriteria } : undefined,
            },
          })
        )
      );
    }

    // Create new tracks if any
    if (tracksToCreate.length > 0) {
      const newTrackData = tracksToCreate.map((track, index) => ({
        name: track.name,
        description: track.description,
        prize: track.prize,
        order: track.order ?? (tracksToUpdate.length + index),
        eligibilityCriteria: track.eligibilityCriteria ?
          { criteria: track.eligibilityCriteria } : undefined,
        hackathonId,
      }));

      await prisma.track.createMany({
        data: newTrackData,
      });
    }

    // Return updated tracks
    const updatedTracks = await prisma.track.findMany({
      where: { hackathonId },
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { projects: true }
        }
      }
    });

    const response: ApiResponse = {
      success: true,
      data: updatedTracks,
      message: 'Tracks updated successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating tracks:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}