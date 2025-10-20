import { Injectable, NotFoundException, ForbiddenException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateHackathonDto, UpdateHackathonDto, HackathonFilterDto } from './dto';

@Injectable()
export class HackathonsService {
  private readonly logger = new Logger(HackathonsService.name);

  constructor(private prisma: PrismaService) {}

  private slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');
  }

  async findAll(userId: string, filters: HackathonFilterDto) {
    const { page, pageSize, sortBy, sortOrder, ...whereFilters } = filters;

    // Build where clause
    const where: any = {
      createdById: userId, // Only show user's hackathons
    };

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
      where.organizationName = {
        contains: whereFilters.organizationName,
        mode: 'insensitive',
      };
    }

    // Date filters
    if (whereFilters.startDateFrom || whereFilters.startDateTo) {
      where.startDate = {};
      if (whereFilters.startDateFrom) {
        where.startDate.gte = new Date(whereFilters.startDateFrom);
      }
      if (whereFilters.startDateTo) {
        where.startDate.lte = new Date(whereFilters.startDateTo);
      }
    }

    if (whereFilters.endDateFrom || whereFilters.endDateTo) {
      where.endDate = {};
      if (whereFilters.endDateFrom) {
        where.endDate.gte = new Date(whereFilters.endDateFrom);
      }
      if (whereFilters.endDateTo) {
        where.endDate.lte = new Date(whereFilters.endDateTo);
      }
    }

    // Calculate pagination
    const skip = (page - 1) * pageSize;

    // Get total count
    const totalCount = await this.prisma.hackathons.count({ where });

    // Get hackathons
    const hackathons = await this.prisma.hackathons.findMany({
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

    return {
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
  }

  async findOne(id: string, userId: string, projectsPage: number = 1, projectsPageSize: number = 20) {
    const hackathon = await this.prisma.hackathons.findUnique({
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
        _count: {
          select: {
            projects: true,
            tracks: true,
          },
        },
      },
    });

    if (!hackathon) {
      throw new NotFoundException('Hackathon not found');
    }

    // Check permission
    if (hackathon.createdById !== userId) {
      throw new ForbiddenException('You do not have permission to access this hackathon');
    }

    // Fetch paginated projects separately with eager loading
    const skip = (projectsPage - 1) * projectsPageSize;
    const [projects, totalProjects] = await Promise.all([
      this.prisma.projects.findMany({
        where: { hackathonId: id },
        skip,
        take: projectsPageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          track: {
            select: {
              id: true,
              name: true,
            },
          },
          innovationReports: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              id: true,
              status: true,
              score: true,
            },
          },
          coherenceReports: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              id: true,
              status: true,
              score: true,
            },
          },
          hederaReports: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              id: true,
              status: true,
              hederaUsageScore: true,
            },
          },
          codeQualityReports: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              id: true,
              status: true,
              overallScore: true,
            },
          },
        },
      }),
      this.prisma.projects.count({
        where: { hackathonId: id },
      }),
    ]);

    const totalPages = Math.ceil(totalProjects / projectsPageSize);

    return {
      ...hackathon,
      project: {
        data: projects,
        pagination: {
          page: projectsPage,
          pageSize: projectsPageSize,
          total: totalProjects,
          totalPages,
          hasNextPage: projectsPage < totalPages,
          hasPreviousPage: projectsPage > 1,
        },
      },
    };
  }

  async create(userId: string, createDto: CreateHackathonDto) {
    const { basicInfo, schedule, tracks, settings } = createDto;

    // Generate slug
    let slug = basicInfo.slug || this.slugify(basicInfo.name);

    // Ensure slug is unique
    let slugSuffix = 0;
    let uniqueSlug = slug;
    while (await this.prisma.hackathons.findFirst({ where: { slug: uniqueSlug } })) {
      slugSuffix++;
      uniqueSlug = `${slug}-${slugSuffix}`;
    }
    slug = uniqueSlug;

    // Create hackathon with related data in transaction
    const result = await this.prisma.$transaction(
      async (tx) => {
        // Create hackathon
        const hackathon = await tx.hackathons.create({
          data: {
            name: basicInfo.name,
            slug,
            description: basicInfo.description,
            organizationName: basicInfo.organizationName,
            prizePool: basicInfo.prizePool,
            bannerImage: basicInfo.bannerImage,
            startDate: new Date(schedule.startDate),
            endDate: new Date(schedule.endDate),
            settings: {
              ...settings,
              registrationDeadline: schedule.registrationDeadline,
              evaluationPeriodEnd: schedule.evaluationPeriodEnd,
              resultAnnouncementDate: schedule.resultAnnouncementDate,
              timezone: schedule.timezone,
            },
            createdById: userId,
          },
        });

        // Create tracks
        if (tracks?.tracks?.length > 0) {
          const trackData = tracks.tracks.map((track, index) => ({
            name: track.name,
            description: track.description,
            prize: track.prize || null,
            order: track.order ?? index,
            eligibilityCriteria:
              track.eligibilityCriteria && track.eligibilityCriteria.length > 0
                ? { criteria: track.eligibilityCriteria }
                : null,
            hackathonId: hackathon.id,
          }));

          await tx.tracks.createMany({ data: trackData });
        }

        

        // Fetch created data
        const createdTracks = await tx.tracks.findMany({
          where: { hackathonId: hackathon.id },
          orderBy: { order: 'asc' },
        });

        

        return {
          ...hackathon,
          tracks: createdTracks,
          };
      },
      { timeout: 15000 }
    );

    // Log activity
    await this.prisma.activity_logs.create({
      data: {
        userId,
        action: 'CREATE_HACKATHON',
        entityType: 'Hackathon',
        entityId: result.id,
        metadata: {
          hackathonName: result.name,
          // status: 'DRAFT',
          tracksCount: tracks?.tracks?.length || 0,
          
        },
      },
    });

    this.logger.log(`Hackathon created: ${result.name} by user ${userId}`);

    return result;
  }

  async update(id: string, userId: string, updateDto: UpdateHackathonDto) {
    // Verify hackathon exists and user has permission
    const existing = await this.findOne(id, userId);

    const { basicInfo, schedule, tracks, settings } = updateDto;

    const updateData: any = {};

    if (basicInfo) {
      if (basicInfo.name) updateData.name = basicInfo.name;
      if (basicInfo.description) updateData.description = basicInfo.description;
      if (basicInfo.organizationName) updateData.organizationName = basicInfo.organizationName;
      if (basicInfo.prizePool !== undefined) updateData.prizePool = basicInfo.prizePool;
      if (basicInfo.bannerImage !== undefined) updateData.bannerImage = basicInfo.bannerImage;
    }

    if (schedule) {
      if (schedule.startDate) updateData.startDate = new Date(schedule.startDate);
      if (schedule.endDate) updateData.endDate = new Date(schedule.endDate);
      if (schedule.registrationDeadline || schedule.evaluationPeriodEnd || schedule.resultAnnouncementDate || schedule.timezone) {
        updateData.settings = {
          ...(existing.settings as any),
          ...settings,
          ...(schedule.registrationDeadline && { registrationDeadline: schedule.registrationDeadline }),
          ...(schedule.evaluationPeriodEnd && { evaluationPeriodEnd: schedule.evaluationPeriodEnd }),
          ...(schedule.resultAnnouncementDate && { resultAnnouncementDate: schedule.resultAnnouncementDate }),
          ...(schedule.timezone && { timezone: schedule.timezone }),
        };
      }
    }

    const updated = await this.prisma.hackathons.update({
      where: { id },
      data: updateData,
      include: {
        tracks: {
          orderBy: { order: 'asc' },
        },
      },
    });

    this.logger.log(`Hackathon updated: ${id} by user ${userId}`);

    return updated;
  }

  async remove(id: string, userId: string) {
    // Verify hackathon exists and user has permission
    await this.findOne(id, userId);

    await this.prisma.hackathons.delete({
      where: { id },
    });

    this.logger.log(`Hackathon deleted: ${id} by user ${userId}`);

    return { message: 'Hackathon deleted successfully' };
  }
}
