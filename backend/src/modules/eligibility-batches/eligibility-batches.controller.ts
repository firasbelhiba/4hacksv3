import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { EligibilityBatchesService } from './eligibility-batches.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateBatchDto } from './dto';

@Controller('hackathons/:hackathonId/eligibility-batches')
@UseGuards(JwtAuthGuard)
export class EligibilityBatchesController {
  constructor(private readonly batchesService: EligibilityBatchesService) {}

  @Post()
  async create(
    @Param('hackathonId') hackathonId: string,
    @CurrentUser('id') userId: string,
    @Body() createDto: CreateBatchDto,
  ) {
    const batch = await this.batchesService.create(hackathonId, userId, createDto);
    return {
      success: true,
      data: batch,
    };
  }

  @Get()
  async findAll(
    @Param('hackathonId') hackathonId: string,
    @CurrentUser('id') userId: string,
  ) {
    const batches = await this.batchesService.findAll(hackathonId, userId);
    return {
      success: true,
      data: batches,
    };
  }

  @Get(':batchId')
  async findOne(
    @Param('hackathonId') hackathonId: string,
    @Param('batchId') batchId: string,
    @CurrentUser('id') userId: string,
  ) {
    const batch = await this.batchesService.findOne(hackathonId, batchId, userId);
    return {
      success: true,
      data: batch,
    };
  }

  @Delete(':batchId')
  async delete(
    @Param('hackathonId') hackathonId: string,
    @Param('batchId') batchId: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.batchesService.delete(hackathonId, batchId, userId);
    return {
      success: true,
      ...result,
    };
  }
}
