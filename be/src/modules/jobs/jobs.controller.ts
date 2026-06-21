import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobDto, UpdateJobDto, JobSearchDto, JobSuggestionDto } from './dto/job-search.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { RoleType } from '@prisma/client';
import { AccessTokenPayload } from '../../common/types/jwt-payload.type';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

class ToggleAlertDto {
  @IsBoolean()
  enabled: boolean;

  @IsOptional()
  @IsString()
  frequency?: string;
}

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  // FL-07 & FL-08: List jobs — public (AU-06)
  @Public()
  @Get()
  findJobs(@Query() searchDto: JobSearchDto) {
    return this.jobsService.findJobs(searchDto);
  }

  // FL-07: Get categories — public
  @Public()
  @Get('categories')
  getCategories() {
    return this.jobsService.getCategories();
  }

  // FL-09: Get job suggestions for freelancer
  @Get('suggestions')
  @UseGuards(RolesGuard)
  @Roles(RoleType.FREELANCER)
  getSuggestions(
    @CurrentUser() user: AccessTokenPayload,
    @Query() suggestionDto: JobSuggestionDto,
  ) {
    return this.jobsService.suggestJobs(user.sub, suggestionDto);
  }

  // FL-10: Get bookmarks
  @Get('bookmarks')
  @UseGuards(RolesGuard)
  @Roles(RoleType.FREELANCER)
  getBookmarks(@CurrentUser() user: AccessTokenPayload) {
    return this.jobsService.getBookmarks(user.sub);
  }

  @Post('bookmarks/:jobId')
  @UseGuards(RolesGuard)
  @Roles(RoleType.FREELANCER)
  addBookmark(
    @CurrentUser() user: AccessTokenPayload,
    @Param('jobId') jobId: string,
  ) {
    return this.jobsService.addBookmark(user.sub, jobId);
  }

  @Delete('bookmarks/:jobId')
  @UseGuards(RolesGuard)
  @Roles(RoleType.FREELANCER)
  removeBookmark(
    @CurrentUser() user: AccessTokenPayload,
    @Param('jobId') jobId: string,
  ) {
    return this.jobsService.removeBookmark(user.sub, jobId);
  }

  @Get('bookmarks/:jobId/status')
  @UseGuards(RolesGuard)
  @Roles(RoleType.FREELANCER)
  checkBookmark(
    @CurrentUser() user: AccessTokenPayload,
    @Param('jobId') jobId: string,
  ) {
    return this.jobsService.isBookmarked(user.sub, jobId);
  }

  // FL-11: Job alerts
  @Get('alerts')
  @UseGuards(RolesGuard)
  @Roles(RoleType.FREELANCER)
  getJobAlert(@CurrentUser() user: AccessTokenPayload) {
    return this.jobsService.getJobAlert(user.sub);
  }

  @Patch('alerts')
  @UseGuards(RolesGuard)
  @Roles(RoleType.FREELANCER)
  updateJobAlert(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: ToggleAlertDto,
  ) {
    return this.jobsService.updateJobAlert(user.sub, dto.enabled, dto.frequency);
  }

  @Post('alerts/toggle')
  @UseGuards(RolesGuard)
  @Roles(RoleType.FREELANCER)
  toggleJobAlert(@CurrentUser() user: AccessTokenPayload) {
    return this.jobsService.toggleJobAlert(user.sub);
  }

  // Client-only endpoints
  @Post()
  @UseGuards(RolesGuard)
  @Roles(RoleType.CLIENT)
  create(
    @CurrentUser() user: AccessTokenPayload,
    @Body() createJobDto: CreateJobDto,
  ) {
    return this.jobsService.create(user.sub, createJobDto);
  }

  @Get('my-jobs')
  @UseGuards(RolesGuard)
  @Roles(RoleType.CLIENT)
  findMyJobs(@CurrentUser() user: AccessTokenPayload) {
    return this.jobsService.findAll(user.sub);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.jobsService.findOneWithClient(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleType.CLIENT)
  update(
    @Param('id') id: string,
    @CurrentUser() user: AccessTokenPayload,
    @Body() updateJobDto: UpdateJobDto,
  ) {
    return this.jobsService.update(id, user.sub, updateJobDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleType.CLIENT)
  remove(
    @Param('id') id: string,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    return this.jobsService.remove(id, user.sub);
  }
}
