import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { RoleType } from '@prisma/client';
import { ContractsService } from './contracts.service';
import {
  CancelContractDto,
  CreateContractDto,
  ReviewMilestoneDto,
  SubmitMilestoneDto,
} from './dto/contracts.dto';
import { ReviewFreelancerDto } from './dto/review-freelancer.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AccessTokenPayload } from '../../common/types/jwt-payload.type';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { memoryStorage } = require('multer');

// ─── Client Contract Routes ───────────────────────────────────────────────────

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('client/contracts')
export class ClientContractsController {
  constructor(private service: ContractsService) {}

  // CL-18: Create contract from accepted bid
  @Post()
  @Roles(RoleType.CLIENT)
  create(@CurrentUser() user: AccessTokenPayload, @Body() dto: CreateContractDto) {
    return this.service.createContract(user.sub, dto);
  }

  // CL-20: List client contracts
  @Get()
  @Roles(RoleType.CLIENT)
  list(@CurrentUser() user: AccessTokenPayload, @Query('status') status?: string) {
    return this.service.listContracts(user.sub, 'client', status as any);
  }

  @Get(':id')
  @Roles(RoleType.CLIENT)
  getOne(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.service.getContract(id, user.sub);
  }

  // CL-21: Client reviews milestone
  @Patch(':id/milestones/:milestoneId/review')
  @Roles(RoleType.CLIENT)
  reviewMilestone(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Param('milestoneId') milestoneId: string,
    @Body() dto: ReviewMilestoneDto,
  ) {
    return this.service.reviewMilestone(id, milestoneId, user.sub, dto);
  }

  // CL-22: Cancel contract
  @Patch(':id/cancel')
  @Roles(RoleType.CLIENT)
  cancel(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() dto: CancelContractDto,
  ) {
    return this.service.cancelContract(id, user.sub, dto);
  }

  // Client reviews Freelancer
  @Post(':id/review-freelancer')
  @Roles(RoleType.CLIENT)
  reviewFreelancer(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() dto: ReviewFreelancerDto,
  ) {
    return this.service.reviewFreelancer(user.sub, id, dto);
  }
}

// ─── Freelancer Contract Routes ───────────────────────────────────────────────

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('freelancer/contracts')
export class FreelancerContractsController {
  constructor(private service: ContractsService) {}

  // FL-19: List contracts
  @Get()
  @Roles(RoleType.FREELANCER)
  list(@CurrentUser() user: AccessTokenPayload, @Query('status') status?: string) {
    return this.service.listContracts(user.sub, 'freelancer', status as any);
  }

  @Get(':id')
  @Roles(RoleType.FREELANCER)
  getOne(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.service.getContract(id, user.sub);
  }

  // FL-22: Submit milestone (Modified for actual file upload)
  @Post(':id/milestones/:milestoneId/submit')
  @Roles(RoleType.FREELANCER)
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  }))
  submitMilestone(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Param('milestoneId') milestoneId: string,
    @Body('description') description: string,
    @UploadedFile() file: any,
  ) {
    return this.service.submitMilestone(id, milestoneId, user.sub, description, file);
  }

  // FL-20: Update milestone progress
  @Patch(':id/milestones/:milestoneId/progress')
  @Roles(RoleType.FREELANCER)
  updateProgress(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Param('milestoneId') milestoneId: string,
    @Body('notes') notes: string,
  ) {
    return this.service.updateMilestoneProgress(id, milestoneId, user.sub, notes);
  }

  // Cancel (both parties can cancel)
  @Patch(':id/cancel')
  @Roles(RoleType.FREELANCER)
  cancel(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() dto: CancelContractDto,
  ) {
    return this.service.cancelContract(id, user.sub, dto);
  }

  // Freelancer reviews Client
  @Post(':id/review-client')
  @Roles(RoleType.FREELANCER)
  reviewClient(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() dto: ReviewFreelancerDto,
  ) {
    return this.service.reviewClient(user.sub, id, dto);
  }
}

// ─── Shared Contracts Controller ──────────────────────────────────────────────

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('contracts')
export class CommonContractsController {
  constructor(private service: ContractsService) {}

  @Get(':id/milestones/:milestoneId/download')
  @Roles(RoleType.CLIENT, RoleType.FREELANCER)
  downloadDeliverable(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Param('milestoneId') milestoneId: string,
    @Res() res: Response,
  ) {
    return this.service.downloadDeliverable(user.sub, id, milestoneId, res);
  }
}
