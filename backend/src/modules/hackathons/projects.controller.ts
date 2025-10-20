import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ProjectsService } from '../projects/projects.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('hackathons/:hackathonId/projects')
@UseGuards(JwtAuthGuard)
export class HackathonProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  async findAll(
    @Param('hackathonId') hackathonId: string,
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    const pageNum = page ? Number(page) : 1;
    const pageSizeNum = pageSize ? Number(pageSize) : 20;
    const result = await this.projectsService.findByHackathon(hackathonId, userId, pageNum, pageSizeNum);
    return {
      success: true,
      ...result,
    };
  }
}
