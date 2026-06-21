import { Controller, Get, Post, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { SavedJobsService } from './saved-jobs.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/job-browse.dto';
import { RoleType } from '@prisma/client';

@Controller('saved-jobs')
@UseGuards(RolesGuard)
@Roles(RoleType.FREELANCER)
export class SavedJobsController {
  constructor(private readonly savedJobsService: SavedJobsService) {}

  @Get()
  list(@CurrentUser() user: any, @Query() pagination: PaginationDto) {
    return this.savedJobsService.listSavedJobs(user.sub, pagination);
  }

  @Get(':jobId/check')
  check(@CurrentUser() user: any, @Param('jobId') jobId: string) {
    return this.savedJobsService.isSaved(user.sub, jobId);
  }

  // FL-10: bookmark
  @Post(':jobId')
  save(@CurrentUser() user: any, @Param('jobId') jobId: string) {
    return this.savedJobsService.saveJob(user.sub, jobId);
  }

  @Delete(':jobId')
  unsave(@CurrentUser() user: any, @Param('jobId') jobId: string) {
    return this.savedJobsService.unsaveJob(user.sub, jobId);
  }
}
