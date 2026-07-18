import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IsEnum, IsString } from 'class-validator';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AccessTokenPayload } from '../../common/types/jwt-payload.type';
import { ReportStatus, RoleType } from '@prisma/client';
import {
  AdminRefundDto,
  BulkUpdateSystemConfigDto,
  CreateAssessmentQuestionDto,
  CreateCategoryDto,
  CreateSkillDto,
  HideJobDto,
  MergeSkillsDto,
  ResolveReportDto,
  UpdateAssessmentQuestionDto,
  UpdateCategoryDto,
  UpdateSkillDto,
  UpdateSystemConfigDto,
} from './dto/admin.dto';
import { ResolveDisputeDto } from '../reports/dto/reports.dto';

class AssignRoleDto {
  @IsEnum(RoleType)
  roleType: RoleType;
}

class SuspendDto {
  @IsString()
  reason: string;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  // ─── DASHBOARD ─────────────────────────────────────────────────────────────

  @Get('stats')
  @Roles(RoleType.ADMIN, RoleType.MODERATOR)
  getStats() {
    return this.adminService.getDashboardStats();
  }

  // ─── USERS ─────────────────────────────────────────────────────────────────

  @Get('users')
  @Roles(RoleType.ADMIN, RoleType.MODERATOR)
  listUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.listUsers(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      search,
    );
  }

  @Get('users/:userId')
  @Roles(RoleType.ADMIN, RoleType.MODERATOR)
  getUser(@Param('userId') userId: string) {
    return this.adminService.getUserById(userId);
  }

  @Post('users')
  @HttpCode(HttpStatus.CREATED)
  @Roles(RoleType.ADMIN)
  createUser(
    @Body() dto: import('./dto/create-admin-user.dto').CreateAdminUserDto,
    @CurrentUser() admin: AccessTokenPayload,
  ) {
    return this.adminService.createUser(dto, admin.sub);
  }

  @Post('users/:userId/roles')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.ADMIN)
  assignRole(
    @Param('userId') userId: string,
    @Body() dto: AssignRoleDto,
    @CurrentUser() admin: AccessTokenPayload,
  ) {
    return this.adminService.assignRole(userId, dto.roleType, admin.sub);
  }

  @Delete('users/:userId/roles/:roleType')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.ADMIN)
  revokeRole(
    @Param('userId') userId: string,
    @Param('roleType') roleType: RoleType,
    @CurrentUser() admin: AccessTokenPayload,
  ) {
    return this.adminService.revokeRole(userId, roleType, admin.sub);
  }

  @Post('users/:userId/suspend')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.ADMIN, RoleType.MODERATOR)
  suspendUser(
    @Param('userId') userId: string,
    @Body() dto: SuspendDto,
    @CurrentUser() admin: AccessTokenPayload,
  ) {
    return this.adminService.suspendUser(userId, dto.reason, admin.sub);
  }

  @Post('users/:userId/unsuspend')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.ADMIN, RoleType.MODERATOR)
  unsuspendUser(
    @Param('userId') userId: string,
    @CurrentUser() admin: AccessTokenPayload,
  ) {
    return this.adminService.unsuspendUser(userId, admin.sub);
  }

  // ─── JOBS ──────────────────────────────────────────────────────────────────

  @Get('jobs')
  @Roles(RoleType.ADMIN, RoleType.MODERATOR)
  listJobs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.listJobs(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      search,
      status,
    );
  }

  @Post('jobs/:jobId/hide')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.ADMIN, RoleType.MODERATOR)
  hideJob(
    @Param('jobId') jobId: string,
    @Body() dto: HideJobDto,
    @CurrentUser() admin: AccessTokenPayload,
  ) {
    return this.adminService.hideJob(jobId, dto, admin.sub);
  }

  @Post('jobs/:jobId/unhide')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.ADMIN, RoleType.MODERATOR)
  unhideJob(@Param('jobId') jobId: string) {
    return this.adminService.unhideJob(jobId);
  }

  @Delete('jobs/:jobId')
  @Roles(RoleType.ADMIN)
  deleteJob(@Param('jobId') jobId: string) {
    return this.adminService.deleteJob(jobId);
  }

  // ─── REPORTS & DISPUTES ────────────────────────────────────────────────────

  @Get('reports')
  @Roles(RoleType.ADMIN, RoleType.MODERATOR)
  listReports(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: ReportStatus,
  ) {
    return this.adminService.listReports(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      status,
    );
  }

  @Get('reports/:reportId')
  @Roles(RoleType.ADMIN, RoleType.MODERATOR)
  getReport(@Param('reportId') reportId: string) {
    return this.adminService.getReport(reportId);
  }

  @Post('reports/:reportId/resolve')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.ADMIN, RoleType.MODERATOR)
  resolveReport(
    @Param('reportId') reportId: string,
    @Body() dto: ResolveReportDto,
    @CurrentUser() admin: AccessTokenPayload,
  ) {
    return this.adminService.resolveReport(reportId, dto, admin.sub);
  }

  @Get('disputes')
  @Roles(RoleType.ADMIN, RoleType.MODERATOR)
  listDisputes(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.listDisputedContracts(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Post('disputes/:disputeId/resolve')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.ADMIN, RoleType.MODERATOR)
  resolveDispute(
    @Param('disputeId') disputeId: string,
    @Body() dto: ResolveDisputeDto,
    @CurrentUser() admin: AccessTokenPayload,
  ) {
    return this.adminService.resolveDispute(disputeId, dto, admin.sub);
  }

  // ─── CATEGORIES & SKILLS ───────────────────────────────────────────────────

  @Get('categories')
  @Roles(RoleType.ADMIN, RoleType.MODERATOR)
  listCategories(@Query('includeHidden') includeHidden?: string) {
    return this.adminService.listCategories(includeHidden !== 'false');
  }

  @Post('categories')
  @HttpCode(HttpStatus.CREATED)
  @Roles(RoleType.ADMIN)
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.adminService.createCategory(dto);
  }

  @Patch('categories/:categoryId')
  @Roles(RoleType.ADMIN)
  updateCategory(
    @Param('categoryId') categoryId: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.adminService.updateCategory(categoryId, dto);
  }

  @Delete('categories/:categoryId')
  @Roles(RoleType.ADMIN)
  deleteCategory(@Param('categoryId') categoryId: string) {
    return this.adminService.deleteCategory(categoryId);
  }

  @Get('skills')
  @Roles(RoleType.ADMIN, RoleType.MODERATOR)
  listSkills(@Query('includeHidden') includeHidden?: string) {
    return this.adminService.listSkills(includeHidden !== 'false');
  }

  @Post('skills')
  @HttpCode(HttpStatus.CREATED)
  @Roles(RoleType.ADMIN)
  createSkill(@Body() dto: CreateSkillDto) {
    return this.adminService.createSkill(dto);
  }

  @Patch('skills/:skillId')
  @Roles(RoleType.ADMIN)
  updateSkill(
    @Param('skillId') skillId: string,
    @Body() dto: UpdateSkillDto,
  ) {
    return this.adminService.updateSkill(skillId, dto);
  }

  @Delete('skills/:skillId')
  @Roles(RoleType.ADMIN)
  deleteSkill(@Param('skillId') skillId: string) {
    return this.adminService.deleteSkill(skillId);
  }

  @Post('skills/merge')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.ADMIN)
  mergeSkills(@Body() dto: MergeSkillsDto) {
    return this.adminService.mergeSkills(dto);
  }

  // ─── TRANSACTIONS ──────────────────────────────────────────────────────────

  @Get('transactions')
  @Roles(RoleType.ADMIN, RoleType.MODERATOR)
  listTransactions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
  ) {
    return this.adminService.listTransactions(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      status,
      type,
    );
  }

  @Post('transactions/refund')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.ADMIN)
  refundTransaction(
    @Body() dto: AdminRefundDto,
    @CurrentUser() admin: AccessTokenPayload,
  ) {
    return this.adminService.adminRefund(dto.transactionId, dto.reason ?? '', admin.sub);
  }

  // ─── SYSTEM CONFIG ─────────────────────────────────────────────────────────

  @Get('config')
  @Roles(RoleType.ADMIN)
  getConfig() {
    return this.adminService.getSystemConfigs();
  }

  @Put('config/:key')
  @Roles(RoleType.ADMIN)
  updateConfig(
    @Param('key') key: string,
    @Body() dto: UpdateSystemConfigDto,
    @CurrentUser() admin: AccessTokenPayload,
  ) {
    return this.adminService.updateSystemConfig(key, dto.value, admin.sub);
  }

  @Put('config')
  @Roles(RoleType.ADMIN)
  bulkUpdateConfig(
    @Body() dto: BulkUpdateSystemConfigDto,
    @CurrentUser() admin: AccessTokenPayload,
  ) {
    return this.adminService.bulkUpdateSystemConfigs(dto, admin.sub);
  }

  // ─── SKILL ASSESSMENT ──────────────────────────────────────────────────────

  @Get('assessment/questions')
  @Roles(RoleType.ADMIN, RoleType.MODERATOR)
  listAssessmentQuestions() {
    return this.adminService.listAssessmentQuestions();
  }

  @Post('assessment/questions')
  @HttpCode(HttpStatus.CREATED)
  @Roles(RoleType.ADMIN)
  createAssessmentQuestion(@Body() dto: CreateAssessmentQuestionDto) {
    return this.adminService.createAssessmentQuestion(dto);
  }

  @Patch('assessment/questions/:questionId')
  @Roles(RoleType.ADMIN)
  updateAssessmentQuestion(
    @Param('questionId') questionId: string,
    @Body() dto: UpdateAssessmentQuestionDto,
  ) {
    return this.adminService.updateAssessmentQuestion(questionId, dto);
  }

  @Delete('assessment/questions/:questionId')
  @Roles(RoleType.ADMIN)
  deleteAssessmentQuestion(@Param('questionId') questionId: string) {
    return this.adminService.deleteAssessmentQuestion(questionId);
  }

  @Get('assessment/stats')
  @Roles(RoleType.ADMIN, RoleType.MODERATOR)
  getAssessmentStats() {
    return this.adminService.getAssessmentStats();
  }
}
