import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { HackathonsService } from './hackathons.service';
import { CreateHackathonDto, UpdateHackathonDto, HackathonFilterDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Hackathons')
@ApiBearerAuth('JWT-auth')
@Controller('hackathons')
@UseGuards(JwtAuthGuard)
export class HackathonsController {
  constructor(private readonly hackathonsService: HackathonsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all hackathons',
    description: 'Retrieve a paginated list of hackathons with optional filtering by status and search query.'
  })
  @ApiQuery({ name: 'status', required: false, enum: ['DRAFT', 'PUBLISHED', 'ONGOING', 'COMPLETED', 'CANCELLED'], description: 'Filter by hackathon status' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search in name and description' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiResponse({
    status: 200,
    description: 'Hackathons retrieved successfully',
    schema: {
      example: {
        success: true,
        data: [
          {
            id: 'hack123',
            name: 'Web3 Hackathon 2025',
            slug: 'web3-hackathon-2025',
            description: 'Build the future of decentralized web',
            status: 'PUBLISHED',
            startDate: '2025-11-01T00:00:00.000Z',
            endDate: '2025-11-03T23:59:59.000Z',
            _count: { tracks: 3, projects: 25 }
          }
        ],
        pagination: { total: 1, page: 1, limit: 10, totalPages: 1 }
      }
    }
  })
  async findAll(@CurrentUser('id') userId: string, @Query() filters: HackathonFilterDto) {
    const result = await this.hackathonsService.findAll(userId, filters);
    return {
      success: true,
      ...result,
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get hackathon by ID',
    description: 'Retrieve detailed information about a specific hackathon including tracks, evaluation criteria, and settings. Supports pagination for projects list.'
  })
  @ApiParam({ name: 'id', description: 'Hackathon ID' })
  @ApiQuery({ name: 'projectsPage', required: false, type: Number, description: 'Projects page number (default: 1)' })
  @ApiQuery({ name: 'projectsPageSize', required: false, type: Number, description: 'Projects per page (default: 20)' })
  @ApiResponse({
    status: 200,
    description: 'Hackathon retrieved successfully',
    schema: {
      example: {
        success: true,
        data: {
          id: 'hack123',
          name: 'Web3 Hackathon 2025',
          slug: 'web3-hackathon-2025',
          description: 'Build the future of decentralized web',
          status: 'PUBLISHED',
          startDate: '2025-11-01T00:00:00.000Z',
          endDate: '2025-11-03T23:59:59.000Z',
          tracks: [{ id: 'track1', name: 'DeFi Track', description: 'Decentralized Finance applications' }],
          evaluationCriteria: [{ id: 'criteria1', name: 'Innovation', weight: 30 }],
          settings: { maxTeamSize: 5, allowSoloParticipants: true },
          projects: { data: [], pagination: { page: 1, pageSize: 20, total: 0 } }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Hackathon not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Query('projectsPage') projectsPage?: number,
    @Query('projectsPageSize') projectsPageSize?: number,
  ) {
    const page = projectsPage ? Number(projectsPage) : 1;
    const pageSize = projectsPageSize ? Number(projectsPageSize) : 20;
    const data = await this.hackathonsService.findOne(id, userId, page, pageSize);
    return {
      success: true,
      data,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new hackathon',
    description: 'Create a new hackathon with basic info, schedule, tracks, evaluation criteria, and settings. Slug is auto-generated from the name.'
  })
  @ApiResponse({
    status: 201,
    description: 'Hackathon created successfully',
    schema: {
      example: {
        success: true,
        data: {
          id: 'hack123',
          name: 'Web3 Hackathon 2025',
          slug: 'web3-hackathon-2025',
          status: 'DRAFT'
        },
        message: 'Hackathon created successfully'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(@CurrentUser('id') userId: string, @Body() createDto: CreateHackathonDto) {
    const data = await this.hackathonsService.create(userId, createDto);
    return {
      success: true,
      data,
      message: 'Hackathon created successfully',
    };
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update hackathon',
    description: 'Update an existing hackathon. All fields are optional. Only provided fields will be updated.'
  })
  @ApiParam({ name: 'id', description: 'Hackathon ID' })
  @ApiResponse({
    status: 200,
    description: 'Hackathon updated successfully',
    schema: {
      example: {
        success: true,
        data: {
          id: 'hack123',
          name: 'Web3 Hackathon 2025 - Updated',
          slug: 'web3-hackathon-2025'
        },
        message: 'Hackathon updated successfully'
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Hackathon not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() updateDto: UpdateHackathonDto,
  ) {
    const data = await this.hackathonsService.update(id, userId, updateDto);
    return {
      success: true,
      data,
      message: 'Hackathon updated successfully',
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete hackathon',
    description: 'Permanently delete a hackathon. This will also delete all associated tracks, projects, and evaluation criteria.'
  })
  @ApiParam({ name: 'id', description: 'Hackathon ID' })
  @ApiResponse({
    status: 200,
    description: 'Hackathon deleted successfully',
    schema: {
      example: {
        success: true,
        message: 'Hackathon deleted successfully'
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Hackathon not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const result = await this.hackathonsService.remove(id, userId);
    return {
      success: true,
      ...result,
    };
  }
}
