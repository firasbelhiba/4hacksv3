import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { HackathonWizardSchema, HackathonFilterSchema } from '@/lib/validations/hackathon';
import { slugify } from '@/lib/utils';
import type { ApiResponse, PaginatedResponse } from '@/types/database';

// GET /api/hackathons - List hackathons with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const filterData = Object.fromEntries(searchParams.entries());

    // Parse and validate filter parameters
    const validatedFilters = HackathonFilterSchema.safeParse({
      ...filterData,
      page: filterData.page ? parseInt(filterData.page) : undefined,
      pageSize: filterData.pageSize ? parseInt(filterData.pageSize) : undefined,
    });

    if (!validatedFilters.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid filter parameters',
          details: validatedFilters.error.issues
        },
        { status: 400 }
      );
    }

    const filters = validatedFilters.data;
    const { page, pageSize, sortBy, sortOrder, ...whereFilters } = filters;

    // Build where clause
    const where: any = {};

    if (whereFilters.query) {
      where.OR = [
        { name: { contains: whereFilters.query, mode: 'insensitive' } },
        { description: { contains: whereFilters.query, mode: 'insensitive' } },
        { organizationName: { contains: whereFilters.query, mode: 'insensitive' } },
      ];
    }

    if (whereFilters.status) {
      where.status = whereFilters.status;
    }

    if (whereFilters.organizationName) {
      where.organizationName = { contains: whereFilters.organizationName, mode: 'insensitive' };
    }

    if (whereFilters.createdBy) {
      where.createdById = whereFilters.createdBy;
    }

    // Date filters
    if (whereFilters.startDateFrom || whereFilters.startDateTo) {
      where.startDate = {};
      if (whereFilters.startDateFrom) {
        where.startDate.gte = whereFilters.startDateFrom;
      }
      if (whereFilters.startDateTo) {
        where.startDate.lte = whereFilters.startDateTo;
      }
    }

    if (whereFilters.endDateFrom || whereFilters.endDateTo) {
      where.endDate = {};
      if (whereFilters.endDateFrom) {
        where.endDate.gte = whereFilters.endDateFrom;
      }
      if (whereFilters.endDateTo) {
        where.endDate.lte = whereFilters.endDateTo;
      }
    }

    // Calculate pagination
    const skip = (page - 1) * pageSize;

    // Get total count
    const totalCount = await prisma.hackathon.count({ where });

    // Get hackathons with pagination
    const hackathons = await prisma.hackathon.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: pageSize,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tracks: {
          select: {
            id: true,
            name: true,
            _count: {
              select: {
                projects: true,
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

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / pageSize);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    const response: PaginatedResponse = {
      success: true,
      data: hackathons,
      pagination: {
        currentPage: page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching hackathons:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/hackathons - Create a new hackathon
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

    // Validate the wizard data
    const validatedData = HackathonWizardSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid hackathon data',
          details: validatedData.error.issues
        },
        { status: 400 }
      );
    }

    const { basicInfo, schedule, tracks, evaluationCriteria, settings } = validatedData.data;

    // Test database connection before proceeding
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('✅ Database connection verified');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 503 }
      );
    }

    // Generate slug if not provided
    let slug = basicInfo.slug || slugify(basicInfo.name);

    // Ensure slug is unique
    let slugSuffix = 0;
    let uniqueSlug = slug;
    while (await prisma.hackathon.findFirst({ where: { slug: uniqueSlug } })) {
      slugSuffix++;
      uniqueSlug = `${slug}-${slugSuffix}`;
    }
    slug = uniqueSlug;

    // Create hackathon with all related data in a transaction with timeout
    const result = await prisma.$transaction(async (tx) => {
      console.log('🚀 Starting hackathon creation transaction');

      // Create the hackathon
      console.log('📝 Creating hackathon record');
      const hackathon = await tx.hackathon.create({
        data: {
          name: basicInfo.name,
          slug,
          description: basicInfo.description,
          organizationName: basicInfo.organizationName,
          prizePool: basicInfo.prizePool,
          bannerImage: basicInfo.bannerImage,
          startDate: schedule.startDate,
          endDate: schedule.endDate,
          settings: {
            ...settings,
            registrationDeadline: schedule.registrationDeadline,
            evaluationPeriodEnd: schedule.evaluationPeriodEnd,
            resultAnnouncementDate: schedule.resultAnnouncementDate,
            timezone: schedule.timezone,
          },
          createdById: session.user.id,
        },
      });

      console.log('🎯 Creating tracks:', tracks?.tracks?.length || 0);
      // Create tracks with createMany for better performance
      const trackData = (tracks?.tracks || []).map((track, index) => ({
        name: track.name,
        description: track.description,
        prize: track.prize || null,
        order: track.order ?? index,
        eligibilityCriteria: track.eligibilityCriteria && track.eligibilityCriteria.length > 0 ?
          { criteria: track.eligibilityCriteria } : null,
        hackathonId: hackathon.id,
      }));

      await tx.track.createMany({
        data: trackData,
      });

      console.log('📊 Creating evaluation criteria:', evaluationCriteria?.criteria?.length || 0);
      // Create evaluation criteria with createMany for better performance
      const criteriaData = (evaluationCriteria?.criteria || []).map((criterion, index) => ({
        name: criterion.name,
        description: criterion.description || null,
        weight: criterion.weight,
        category: criterion.category,
        order: criterion.order ?? index,
        hackathonId: hackathon.id,
      }));

      await tx.evaluationCriterion.createMany({
        data: criteriaData,
      });

      // Fetch created tracks and criteria for response
      console.log('🔍 Fetching created records');
      const createdTracks = await tx.track.findMany({
        where: { hackathonId: hackathon.id },
        orderBy: { order: 'asc' },
      });

      const createdCriteria = await tx.evaluationCriterion.findMany({
        where: { hackathonId: hackathon.id },
        orderBy: { order: 'asc' },
      });

      console.log('✅ Transaction completed successfully');
      return {
        ...hackathon,
        tracks: createdTracks,
        evaluationCriteria: createdCriteria,
      };
    }, {
      timeout: 15000, // 15 second timeout
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE_HACKATHON',
        entityType: 'Hackathon',
        entityId: result.id,
        metadata: {
          hackathonName: result.name,
          status: result.status,
          tracksCount: tracks?.tracks?.length || 0,
          criteriaCount: evaluationCriteria?.criteria?.length || 0,
        },
      },
    });

    const response: ApiResponse = {
      success: true,
      data: result,
      message: 'Hackathon created successfully',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating hackathon:', error);

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