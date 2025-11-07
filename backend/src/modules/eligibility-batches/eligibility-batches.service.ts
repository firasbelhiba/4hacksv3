import { Injectable, NotFoundException, ForbiddenException, Logger, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateBatchDto } from './dto';

@Injectable()
export class EligibilityBatchesService {
  private readonly logger = new Logger(EligibilityBatchesService.name);

  constructor(private prisma: PrismaService) {}

  async create(hackathonId: string, userId: string, createDto: CreateBatchDto) {
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

    // Check if batch name already exists for this hackathon
    const existingBatch = await this.prisma.eligibility_batches.findFirst({
      where: {
        hackathonId,
        name: createDto.name,
      },
    });

    if (existingBatch) {
      throw new ConflictException('A batch with this name already exists for this hackathon');
    }

    // Verify all projects belong to this hackathon
    const projects = await this.prisma.projects.findMany({
      where: {
        id: { in: createDto.projectIds },
        hackathonId,
      },
      select: { id: true },
    });

    if (projects.length !== createDto.projectIds.length) {
      const foundIds = projects.map(p => p.id);
      const missingIds = createDto.projectIds.filter(id => !foundIds.includes(id));
      this.logger.error(`Project verification failed. Expected: ${createDto.projectIds.length}, Found: ${projects.length}`);
      this.logger.error(`Missing project IDs: ${missingIds.join(', ')}`);
      throw new NotFoundException(`Some projects not found or do not belong to this hackathon. Missing: ${missingIds.length} projects`);
    }

    // Create batch with projects
    const batch = await this.prisma.eligibility_batches.create({
      data: {
        hackathonId,
        name: createDto.name,
        description: createDto.description,
        criteria: createDto.criteria || {},
        totalProjects: createDto.projectIds.length,
        createdById: userId,
        batchProjects: {
          create: createDto.projectIds.map(projectId => ({
            projectId,
          })),
        },
      },
      include: {
        batchProjects: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                teamName: true,
                githubUrl: true,
                track: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    this.logger.log(`Batch created: ${batch.name} with ${batch.totalProjects} projects by user ${userId}`);

    return batch;
  }

  async findAll(hackathonId: string, userId: string) {
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

    const batches = await this.prisma.eligibility_batches.findMany({
      where: { hackathonId },
      include: {
        _count: {
          select: {
            batchProjects: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return batches;
  }

  async findOne(hackathonId: string, batchId: string, userId: string) {
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

    const batch = await this.prisma.eligibility_batches.findFirst({
      where: {
        id: batchId,
        hackathonId,
      },
      include: {
        batchProjects: {
          include: {
            project: {
              include: {
                track: true,
                hederaReports: {
                  orderBy: { createdAt: 'desc' },
                  take: 1,
                },
                eligibilityReports: {
                  orderBy: { createdAt: 'desc' },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    return batch;
  }

  async delete(hackathonId: string, batchId: string, userId: string) {
    // Verify hackathon access and batch ownership
    const batch = await this.prisma.eligibility_batches.findFirst({
      where: {
        id: batchId,
        hackathonId,
        hackathon: {
          createdById: userId,
        },
      },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found or access denied');
    }

    await this.prisma.eligibility_batches.delete({
      where: { id: batchId },
    });

    this.logger.log(`Batch deleted: ${batchId} by user ${userId}`);

    return { message: 'Batch deleted successfully' };
  }
}
