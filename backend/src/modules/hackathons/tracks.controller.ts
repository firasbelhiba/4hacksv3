import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { TracksService, TrackDto } from './tracks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Tracks')
@ApiBearerAuth('JWT-auth')
@Controller('hackathons/:hackathonId/tracks')
@UseGuards(JwtAuthGuard)
export class TracksController {
  constructor(private readonly tracksService: TracksService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all tracks for a hackathon',
    description: 'Retrieve all tracks associated with a specific hackathon, with optional search query.'
  })
  @ApiParam({ name: 'hackathonId', description: 'Hackathon ID' })
  @ApiQuery({ name: 'query', required: false, type: String, description: 'Search query for track name' })
  @ApiResponse({
    status: 200,
    description: 'Tracks retrieved successfully',
    schema: {
      example: {
        success: true,
        data: [
          {
            id: 'track1',
            name: 'DeFi Track',
            description: 'Decentralized Finance applications',
            prizes: ['$5000', '$3000', '$2000'],
            _count: { projects: 10 }
          }
        ]
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Hackathon not found' })
  async findAll(
    @Param('hackathonId') hackathonId: string,
    @CurrentUser('id') userId: string,
    @Query('query') query?: string,
  ) {
    const data = await this.tracksService.findAll(hackathonId, userId, query);
    return {
      success: true,
      data,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add a track to hackathon',
    description: 'Create a new track for a specific hackathon with name, description, and optional prizes.'
  })
  @ApiParam({ name: 'hackathonId', description: 'Hackathon ID' })
  @ApiBody({
    schema: {
      example: {
        name: 'NFT Track',
        description: 'Non-Fungible Token applications',
        prizes: ['$4000', '$2000', '$1000']
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Track created successfully',
    schema: {
      example: {
        success: true,
        data: {
          id: 'track2',
          name: 'NFT Track',
          description: 'Non-Fungible Token applications',
          prizes: ['$4000', '$2000', '$1000']
        },
        message: 'Track created successfully'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Hackathon not found' })
  async create(
    @Param('hackathonId') hackathonId: string,
    @CurrentUser('id') userId: string,
    @Body() trackDto: TrackDto,
  ) {
    const data = await this.tracksService.create(hackathonId, userId, trackDto);
    return {
      success: true,
      data,
      message: 'Track created successfully',
    };
  }

  @Put()
  @ApiOperation({
    summary: 'Batch update tracks',
    description: 'Update multiple tracks at once. Used for reordering or bulk editing tracks.'
  })
  @ApiParam({ name: 'hackathonId', description: 'Hackathon ID' })
  @ApiBody({
    schema: {
      example: {
        tracks: [
          {
            id: 'track1',
            name: 'DeFi Track - Updated',
            description: 'Decentralized Finance applications',
            prizes: ['$6000', '$4000', '$2000']
          },
          {
            id: 'track2',
            name: 'NFT Track',
            description: 'Non-Fungible Token applications',
            prizes: ['$4000', '$2000', '$1000']
          }
        ]
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Tracks updated successfully',
    schema: {
      example: {
        success: true,
        data: [
          { id: 'track1', name: 'DeFi Track - Updated' },
          { id: 'track2', name: 'NFT Track' }
        ],
        message: 'Tracks updated successfully'
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Hackathon not found' })
  async batchUpdate(
    @Param('hackathonId') hackathonId: string,
    @CurrentUser('id') userId: string,
    @Body('tracks') tracks: TrackDto[],
  ) {
    const data = await this.tracksService.batchUpdate(hackathonId, userId, tracks);
    return {
      success: true,
      data,
      message: 'Tracks updated successfully',
    };
  }
}
