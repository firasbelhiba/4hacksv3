import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, UpdateProjectDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Projects')
@ApiBearerAuth('JWT-auth')
@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all projects',
    description: 'Retrieve a list of all projects belonging to the authenticated user\'s hackathons. Returns basic project information including IDs, names, status, GitHub URLs, and associated hackathon/track details.'
  })
  @ApiResponse({
    status: 200,
    description: 'Projects retrieved successfully',
    schema: {
      example: {
        success: true,
        data: [
          {
            id: 'cm2abc123xyz',
            name: 'DeFi Swap Platform',
            teamName: 'Team Alpha',
            description: 'A decentralized exchange',
            githubUrl: 'https://github.com/user/defi-swap',
            demoUrl: 'https://demo.example.com',
            status: 'SUBMITTED',
            createdAt: '2025-10-30T10:00:00.000Z',
            hackathon: {
              id: 'hack123',
              name: 'Web3 Hackathon 2025'
            },
            track: {
              id: 'track1',
              name: 'DeFi Track'
            }
          }
        ],
        count: 1
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async findAll(@CurrentUser('id') userId: string) {
    const data = await this.projectsService.findAll(userId);
    return {
      success: true,
      data: data.projects,
      count: data.count,
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get project by ID',
    description: 'Retrieve detailed information about a specific project including hackathon, track, team members, and all analysis reports.'
  })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({
    status: 200,
    description: 'Project retrieved successfully',
    schema: {
      example: {
        success: true,
        data: {
          projects: {
            id: 'proj123',
            name: 'DeFi Swap Platform',
            description: 'A decentralized exchange built on Hedera',
            githubUrl: 'https://github.com/user/defi-swap',
            status: 'SUBMITTED',
            hackathons: { id: 'hack123', name: 'Web3 Hackathon 2025' },
            tracks: { id: 'track1', name: 'DeFi Track' },
            teamMembers: [{ name: 'John Doe', email: 'john@example.com', role: 'Developer' }],
            innovationReport: { id: 'report1', status: 'COMPLETED', score: 85 },
            coherenceReport: { id: 'report2', status: 'COMPLETED', score: 90 },
            hederaAnalysisReport: { id: 'report3', status: 'COMPLETED', score: 78 }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const project = await this.projectsService.findOne(id, userId);
    return {
      success: true,
      data: { project },
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new project',
    description: 'Submit a new project to a hackathon. Requires hackathon ID, track ID, GitHub URL, and team member details.'
  })
  @ApiResponse({
    status: 201,
    description: 'Project created successfully',
    schema: {
      example: {
        success: true,
        data: {
          id: 'proj123',
          name: 'DeFi Swap Platform',
          status: 'DRAFT',
          hackathonId: 'hack123',
          trackId: 'track1'
        },
        message: 'Project created successfully'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid input data or GitHub repository not accessible' })
  @ApiResponse({ status: 404, description: 'Hackathon or track not found' })
  async create(@CurrentUser('id') userId: string, @Body() createDto: CreateProjectDto) {
    const data = await this.projectsService.create(userId, createDto);
    return {
      success: true,
      data,
      message: 'Project created successfully',
    };
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update project',
    description: 'Update an existing project. All fields are optional. Can update project details, team members, URLs, etc.'
  })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({
    status: 200,
    description: 'Project updated successfully',
    schema: {
      example: {
        success: true,
        data: {
          id: 'proj123',
          name: 'DeFi Swap Platform - Updated',
          status: 'SUBMITTED'
        },
        message: 'Project updated successfully'
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions to update this project' })
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() updateDto: UpdateProjectDto,
  ) {
    const data = await this.projectsService.update(id, userId, updateDto);
    return {
      success: true,
      data,
      message: 'Project updated successfully',
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete project',
    description: 'Permanently delete a project and all associated analysis reports and data.'
  })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({
    status: 200,
    description: 'Project deleted successfully',
    schema: {
      example: {
        success: true,
        message: 'Project deleted successfully'
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions to delete this project' })
  async remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const result = await this.projectsService.remove(id, userId);
    return {
      success: true,
      ...result,
    };
  }
}
