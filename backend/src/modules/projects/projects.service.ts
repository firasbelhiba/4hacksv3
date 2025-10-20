import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateProjectDto, UpdateProjectDto } from './dto';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

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

  private async verifyProjectAccess(projectId: string, userId: string) {
    const project = await this.prisma.projects.findFirst({
      where: {
        id: projectId,
        hackathon: {
          createdById: userId,
        },
      },
      include: {
        hackathon: {
          select: {
            id: true,
            name: true,
            createdById: true,
          },
        },
        track: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found or access denied');
    }

    return project;
  }

  async findOne(projectId: string, userId: string) {
    const project = await this.prisma.projects.findFirst({
      where: {
        id: projectId,
        hackathon: {
          createdById: userId,
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
      throw new NotFoundException('Project not found or access denied');
    }

    return project;
  }

  async create(userId: string, createDto: CreateProjectDto) {
    const { hackathonId, trackId, teamMembers, ...projectData } = createDto;

    // Verify hackathon access
    const hackathon = await this.prisma.hackathons.findFirst({
      where: {
        id: hackathonId,
        createdById: userId,
      },
    });

    if (!hackathon) {
      throw new ForbiddenException('Hackathon not found or access denied');
    }

    // Verify track belongs to hackathon
    const track = await this.prisma.tracks.findFirst({
      where: {
        id: trackId,
        hackathonId,
      },
    });

    if (!track) {
      throw new NotFoundException('Track not found in this hackathon');
    }

    // Generate slug
    let slug = this.slugify(projectData.name);
    let slugSuffix = 0;
    let uniqueSlug = slug;
    while (await this.prisma.projects.findFirst({ where: { slug: uniqueSlug } })) {
      slugSuffix++;
      uniqueSlug = `${slug}-${slugSuffix}`;
    }
    slug = uniqueSlug;

    // Create project using nested create for relations
    const project = await this.prisma.projects.create({
      data: {
        ...projectData,
        slug,
        teamMembers: teamMembers as any || [],
        hackathon: {
          connect: { id: hackathonId },
        },
        track: {
          connect: { id: trackId },
        },
      },
      include: {
        hackathon: {
          select: { id: true, name: true },
        },
        track: {
          select: { id: true, name: true },
        },
      },
    });

    this.logger.log(`Project created: ${project.name} by user ${userId}`);

    return project;
  }

  async update(projectId: string, userId: string, updateDto: UpdateProjectDto) {
    // Verify access
    await this.verifyProjectAccess(projectId, userId);

    // Remove hackathonId and trackId from update if they exist
    const { hackathonId, trackId, ...safeUpdateDto } = updateDto as any;

    const updated = await this.prisma.projects.update({
      where: { id: projectId },
      data: safeUpdateDto,
      include: {
        hackathon: {
          select: { id: true, name: true },
        },
        track: {
          select: { id: true, name: true },
        },
      },
    });

    this.logger.log(`Project updated: ${projectId} by user ${userId}`);

    return updated;
  }

  async remove(projectId: string, userId: string) {
    // Verify access
    await this.verifyProjectAccess(projectId, userId);

    await this.prisma.projects.delete({
      where: { id: projectId },
    });

    this.logger.log(`Project deleted: ${projectId} by user ${userId}`);

    return { message: 'Project deleted successfully' };
  }

  // Get all projects for a hackathon (with pagination and eager loading)
  async findByHackathon(
    hackathonId: string,
    userId: string,
    page: number = 1,
    pageSize: number = 20,
  ) {
    // Verify hackathon access
    const hackathon = await this.prisma.hackathons.findFirst({
      where: {
        id: hackathonId,
        createdById: userId,
      },
    });

    if (!hackathon) {
      throw new ForbiddenException('Hackathon not found or access denied');
    }

    const skip = (page - 1) * pageSize;

    const [projects, totalCount] = await Promise.all([
      this.prisma.projects.findMany({
        where: { hackathonId },
        skip,
        take: pageSize,
        include: {
          hackathon: {
            select: {
              id: true,
              name: true,
            },
          },
          track: {
            select: { id: true, name: true },
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
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.projects.count({
        where: { hackathonId },
      }),
    ]);

    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      data: projects,
      pagination: {
        page,
        pageSize,
        total: totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }
}
