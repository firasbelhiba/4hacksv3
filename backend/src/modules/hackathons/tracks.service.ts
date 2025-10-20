import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

export interface TrackDto {
  id?: string;
  name: string;
  description: string;
  prize?: string;
  order?: number;
  eligibilityCriteria?: string[];
}

@Injectable()
export class TracksService {
  constructor(private prisma: PrismaService) {}

  private async verifyHackathonAccess(hackathonId: string, userId: string) {
    const hackathon = await this.prisma.hackathons.findFirst({
      where: {
        id: hackathonId,
        createdById: userId,
      },
    });

    if (!hackathon) {
      throw new NotFoundException('Hackathon not found or access denied');
    }

    return hackathon;
  }

  async findAll(hackathonId: string, userId: string, query?: string) {
    await this.verifyHackathonAccess(hackathonId, userId);

    const where: any = { hackathonId };

    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
    }

    return this.prisma.tracks.findMany({
      where,
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: {
            projects: true,
          },
        },
      },
    });
  }

  async create(hackathonId: string, userId: string, trackDto: TrackDto) {
    const hackathon = await this.verifyHackathonAccess(hackathonId, userId);

    // Check for duplicate track name
    const existingTrack = await this.prisma.tracks.findFirst({
      where: {
        hackathonId,
        name: {
          equals: trackDto.name,
          mode: 'insensitive',
        },
      },
    });

    if (existingTrack) {
      throw new ForbiddenException('A track with this name already exists in this hackathon');
    }

    // Get next order number if not provided
    let order = trackDto.order;
    if (order === undefined || order === 0) {
      const maxOrder = await this.prisma.tracks.aggregate({
        where: { hackathonId },
        _max: { order: true },
      });
      order = (maxOrder._max.order || 0) + 1;
    }

    const track = await this.prisma.tracks.create({
      data: {
        name: trackDto.name,
        description: trackDto.description,
        prize: trackDto.prize,
        order,
        eligibilityCriteria:
          trackDto.eligibilityCriteria && trackDto.eligibilityCriteria.length > 0
            ? { criteria: trackDto.eligibilityCriteria }
            : null,
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
    await this.prisma.activity_logs.create({
      data: {
        userId,
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

    return track;
  }

  async batchUpdate(hackathonId: string, userId: string, tracks: TrackDto[]) {
    await this.verifyHackathonAccess(hackathonId, userId);

    const tracksToUpdate = tracks.filter((track) => track.id);
    const tracksToCreate = tracks.filter((track) => !track.id);

    // Update existing tracks
    if (tracksToUpdate.length > 0) {
      await Promise.all(
        tracksToUpdate.map((track) =>
          this.prisma.tracks.update({
            where: { id: track.id },
            data: {
              name: track.name,
              description: track.description,
              prize: track.prize,
              order: track.order,
              eligibilityCriteria:
                track.eligibilityCriteria && track.eligibilityCriteria.length > 0
                  ? { criteria: track.eligibilityCriteria }
                  : null,
            },
          })
        )
      );
    }

    // Create new tracks
    if (tracksToCreate.length > 0) {
      const newTrackData = tracksToCreate.map((track, index) => ({
        name: track.name,
        description: track.description,
        prize: track.prize,
        order: track.order ?? tracksToUpdate.length + index,
        eligibilityCriteria:
          track.eligibilityCriteria && track.eligibilityCriteria.length > 0
            ? { criteria: track.eligibilityCriteria }
            : null,
        hackathonId,
      }));

      await this.prisma.tracks.createMany({
        data: newTrackData,
      });
    }

    // Return all updated tracks
    return this.prisma.tracks.findMany({
      where: { hackathonId },
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { projects: true },
        },
      },
    });
  }
}
