import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RoleType } from '@prisma/client';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(RoleType.CLIENT)
  create(@CurrentUser() user: any, @Body() createJobDto: CreateJobDto) {
    return this.jobsService.create(user.sub, createJobDto);
  }

  @Get('categories')
  getCategories() {
    return this.jobsService.getCategories();
  }

  @Get()
  findAll(@Query('clientId') clientId?: string) {
    return this.jobsService.findAll(clientId);
  }

  @Get('my-jobs')
  @UseGuards(RolesGuard)
  @Roles(RoleType.CLIENT)
  findMyJobs(@CurrentUser() user: any) {
    return this.jobsService.findAll(user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.jobsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleType.CLIENT)
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateJobDto: UpdateJobDto,
  ) {
    return this.jobsService.update(id, user.sub, updateJobDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleType.CLIENT)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.jobsService.remove(id, user.sub);
  }
}
