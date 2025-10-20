import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { HackathonUpdateSchema } from '@/lib/validations/hackathon';
import { slugify } from '@/lib/utils';
import type { ApiResponse } from '@/types/database';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/hackathons/[id] - Get a specific hackathon
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    const hackathon = await prisma.hackathon.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tracks: {
          orderBy: { order: 'asc' },
          include: {
            _count: {
              select: {
                projects: true,
              },
            },
          },
        },
        evaluationCriteria: {
          orderBy: { order: 'asc' },
        },
        projects: {
          include: {
            track: {
              select: {
                id: true,
                name: true,
              },
            },
            evaluation: {
              select: {
                id: true,
                overallScore: true,
                status: true,
              },
            },
          },
        },
        tournament: {
          include: {
            matches: {
              include: {
                project1: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                project2: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                winner: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            projects: true,
            tracks: true,
          },
        },
      },
    });

    if (!hackathon) {
      return NextResponse.json(
        { success: false, error: 'Hackathon not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to view this hackathon
    // For now, only allow the creator to view/edit (you can expand this later for public hackathons)
    if (hackathon.createdById !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to access this hackathon' },
        { status: 403 }
      );
    }

    const response: ApiResponse = {
      success: true,
      data: hackathon,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching hackathon:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/hackathons/[id] - Update a hackathon
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();

    // Validate the update data
    const validatedData = HackathonUpdateSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid update data',
          details: validatedData.error.issues
        },
        { status: 400 }
      );
    }

    // Check if hackathon exists
    const existingHackathon = await prisma.hackathon.findUnique({
      where: { id },
      include: {
        tracks: true,
        evaluationCriteria: true,
      },
    });

    if (!existingHackathon) {
      return NextResponse.json(
        { success: false, error: 'Hackathon not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to edit this hackathon
    if (existingHackathon.createdById !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to edit this hackathon' },
        { status: 403 }
      );
    }

    const { basicInfo, schedule, tracks, evaluationCriteria, settings } = validatedData.data;

    // Update hackathon with related data in a transaction with extended timeout
    console.log('🚀 Starting hackathon update transaction');
    const startTime = Date.now();

    const result = await prisma.$transaction(async (tx) => {
      console.log('📝 Transaction started, updating hackathon data');
      let updateData: any = {};

      // Update basic info
      if (basicInfo) {
        updateData = {
          ...updateData,
          name: basicInfo.name,
          description: basicInfo.description,
          organizationName: basicInfo.organizationName,
          prizePool: basicInfo.prizePool,
          bannerImage: basicInfo.bannerImage,
        };

        // Update slug if name changed
        if (basicInfo.name && basicInfo.name !== existingHackathon.name) {
          let slug = basicInfo.slug || slugify(basicInfo.name);

          // Ensure slug is unique (excluding current hackathon)
          let slugSuffix = 0;
          let uniqueSlug = slug;
          while (await tx.hackathon.findFirst({
            where: {
              slug: uniqueSlug,
              id: { not: id }
            }
          })) {
            slugSuffix++;
            uniqueSlug = `${slug}-${slugSuffix}`;
          }
          updateData.slug = uniqueSlug;
        }
      }

      // Update schedule
      if (schedule) {
        updateData = {
          ...updateData,
          startDate: schedule.startDate,
          endDate: schedule.endDate,
        };

        // Update settings with schedule data
        const currentSettings = (existingHackathon.settings as any) || {};
        updateData.settings = {
          ...currentSettings,
          ...(settings || {}),
          registrationDeadline: schedule.registrationDeadline,
          evaluationPeriodEnd: schedule.evaluationPeriodEnd,
          resultAnnouncementDate: schedule.resultAnnouncementDate,
          timezone: schedule.timezone,
        };
      } else if (settings) {
        const currentSettings = (existingHackathon.settings as any) || {};
        updateData.settings = {
          ...currentSettings,
          ...settings,
        };
      }

      // Update the hackathon
      const updatedHackathon = await tx.hackathon.update({
        where: { id },
        data: updateData,
      });

      // Update tracks if provided
      console.log('🔍 DEBUG: API received tracks data:', {
        tracks,
        tracksArray: tracks?.tracks,
        tracksLength: tracks?.tracks?.length
      });
      if (tracks) {
        // Delete existing tracks that are not in the new list
        const newTrackIds = tracks.tracks
          .filter(track => track.id)
          .map(track => track.id!);

        // Delete existing tracks that are not in the new list
        if (newTrackIds.length > 0) {
          await tx.track.deleteMany({
            where: {
              hackathonId: id,
              id: { notIn: newTrackIds },
            },
          });
        } else {
          // If no tracks are being kept, delete all
          await tx.track.deleteMany({
            where: {
              hackathonId: id,
            },
          });
        }

        // Separate tracks into updates and creates for better performance
        const tracksToUpdate = tracks.tracks.filter(track => track.id);
        const tracksToCreate = tracks.tracks.filter(track => !track.id);

        // Update existing tracks in batch if possible
        for (const track of tracksToUpdate) {
          const index = tracks.tracks.indexOf(track);
          await tx.track.update({
            where: { id: track.id },
            data: {
              name: track.name,
              description: track.description,
              prize: track.prize,
              order: track.order ?? index,
              eligibilityCriteria: track.eligibilityCriteria ?
                { criteria: track.eligibilityCriteria } : undefined,
            },
          });
        }

        // Create new tracks
        if (tracksToCreate.length > 0) {
          const newTrackData = tracksToCreate.map((track, index) => ({
            name: track.name,
            description: track.description,
            prize: track.prize,
            order: track.order ?? (tracksToUpdate.length + index),
            eligibilityCriteria: track.eligibilityCriteria ?
              { criteria: track.eligibilityCriteria } : undefined,
            hackathonId: id,
          }));

          await tx.track.createMany({
            data: newTrackData,
          });
        }
      }

      // Update evaluation criteria if provided
      if (evaluationCriteria) {
        // Delete existing criteria that are not in the new list
        const newCriteriaIds = evaluationCriteria.criteria
          .filter(criterion => criterion.id)
          .map(criterion => criterion.id!);

        // Delete existing criteria that are not in the new list
        if (newCriteriaIds.length > 0) {
          await tx.evaluationCriterion.deleteMany({
            where: {
              hackathonId: id,
              id: { notIn: newCriteriaIds },
            },
          });
        } else {
          // If no criteria are being kept, delete all
          await tx.evaluationCriterion.deleteMany({
            where: {
              hackathonId: id,
            },
          });
        }

        // Separate criteria into updates and creates for better performance
        const criteriaToUpdate = evaluationCriteria.criteria.filter(criterion => criterion.id);
        const criteriaToCreate = evaluationCriteria.criteria.filter(criterion => !criterion.id);

        // Update existing criteria
        for (const criterion of criteriaToUpdate) {
          const index = evaluationCriteria.criteria.indexOf(criterion);
          await tx.evaluationCriterion.update({
            where: { id: criterion.id },
            data: {
              name: criterion.name,
              description: criterion.description,
              weight: criterion.weight,
              category: criterion.category,
              order: criterion.order ?? index,
            },
          });
        }

        // Create new criteria
        if (criteriaToCreate.length > 0) {
          const newCriteriaData = criteriaToCreate.map((criterion, index) => ({
            name: criterion.name,
            description: criterion.description,
            weight: criterion.weight,
            category: criterion.category,
            order: criterion.order ?? (criteriaToUpdate.length + index),
            hackathonId: id,
          }));

          await tx.evaluationCriterion.createMany({
            data: newCriteriaData,
          });
        }
      }

      console.log('✅ Transaction completed successfully');
      return updatedHackathon;
    }, {
      timeout: 30000, // 30 second timeout
    });

    const endTime = Date.now();
    console.log(`⏱️ Transaction completed in ${endTime - startTime}ms`);

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE_HACKATHON',
        entityType: 'Hackathon',
        entityId: id,
        metadata: {
          hackathonName: result.name,
          updatedSections: Object.keys(validatedData.data),
        },
      },
    });

    const response: ApiResponse = {
      success: true,
      data: result,
      message: 'Hackathon updated successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating hackathon:', error);

    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { success: false, error: 'A hackathon with this name already exists' },
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

// DELETE /api/hackathons/[id] - Delete a hackathon
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Check if hackathon exists
    const existingHackathon = await prisma.hackathon.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            projects: true,
            tracks: true,
          },
        },
      },
    });

    if (!existingHackathon) {
      return NextResponse.json(
        { success: false, error: 'Hackathon not found' },
        { status: 404 }
      );
    }

    // Check if hackathon has projects - prevent deletion if it does
    if (existingHackathon._count.projects > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete hackathon with existing projects. Please delete all projects first.'
        },
        { status: 409 }
      );
    }

    // Delete hackathon and all related data
    await prisma.$transaction(async (tx) => {
      // Delete evaluation criteria
      await tx.evaluationCriterion.deleteMany({
        where: { hackathonId: id },
      });

      // Delete tracks
      await tx.track.deleteMany({
        where: { hackathonId: id },
      });

      // Delete tournament if exists
      await tx.tournament.deleteMany({
        where: { hackathonId: id },
      });

      // Delete the hackathon
      await tx.hackathon.delete({
        where: { id },
      });
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'DELETE_HACKATHON',
        entityType: 'Hackathon',
        entityId: id,
        metadata: {
          hackathonName: existingHackathon.name,
          tracksCount: existingHackathon._count.tracks,
        },
      },
    });

    const response: ApiResponse = {
      success: true,
      message: 'Hackathon deleted successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error deleting hackathon:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}