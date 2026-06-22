import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RoleType } from '@prisma/client';
import { ContractsService } from './contracts.service';
import {
  CancelContractDto,
  CreateContractDto,
  ReviewMilestoneDto,
  SubmitMilestoneDto,
} from './dto/contracts.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AccessTokenPayload } from '../../common/types/jwt-payload.type';

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

  // FL-22: Submit milestone
  @Post(':id/milestones/:milestoneId/submit')
  @Roles(RoleType.FREELANCER)
  submitMilestone(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Param('milestoneId') milestoneId: string,
    @Body() dto: SubmitMilestoneDto,
  ) {
    return this.service.submitMilestone(id, milestoneId, user.sub, dto);
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
}
