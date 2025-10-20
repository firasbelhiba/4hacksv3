import { Module } from '@nestjs/common';
import { HackathonsService } from './hackathons.service';
import { HackathonsController } from './hackathons.controller';
import { TracksService } from './tracks.service';
import { TracksController } from './tracks.controller';
import { HackathonProjectsController } from './projects.controller';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [ProjectsModule],
  controllers: [HackathonsController, TracksController, HackathonProjectsController],
  providers: [HackathonsService, TracksService],
  exports: [HackathonsService, TracksService],
})
export class HackathonsModule {}
