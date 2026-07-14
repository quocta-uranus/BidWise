import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { TokenService } from '../token/token.service';
import { EmailService } from '../email/email.service';
import {
  ReportAction,
  ReportStatus,
  ReportType,
  RoleType,
  TransactionStatus,
} from '@prisma/client';
import type {
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
} from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private tokenService: TokenService,
    private emailService: EmailService,
  ) { }

  async listUsers(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where = search
      ? {
        OR: [
          { email: { contains: search, mode: 'insensitive' as const } },
          { fullName: { contains: search, mode: 'insensitive' as const } },
        ],
      }
      : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: { userRoles: { include: { role: true } } },
        omit: { passwordHash: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, total, page, limit };
  }

  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: { include: { role: true } },
        loginSessions: { orderBy: { createdAt: 'desc' }, take: 10 },
        accountLogs: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
      omit: { passwordHash: true },
    });
    if (!user) throw new NotFoundException('USER_NOT_FOUND');
    return user;
  }

  async createUser(dto: import('./dto/create-admin-user.dto').CreateAdminUserDto, createdBy: string) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new BadRequestException('EMAIL_ALREADY_EXISTS');

    const role = await this.prisma.role.findUnique({ where: { name: dto.role } });
    if (!role) throw new NotFoundException('ROLE_NOT_FOUND');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        status: 'ACTIVE', // Bypass OTP
        emailVerifiedAt: new Date(),
        userRoles: {
          create: {
            roleId: role.id,
            assignedBy: createdBy,
          },
        },
        accountLogs: {
          create: {
            action: 'REGISTERED',
            performedBy: createdBy,
            metadata: { initialRole: dto.role, createdByAdmin: true },
          },
        },
      },
      omit: { passwordHash: true },
    });

    return user;
  }

  async assignRole(userId: string, roleType: RoleType, assignedBy: string): Promise<void> {
    const [user, role] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.role.findUnique({ where: { name: roleType } }),
    ]);

    if (!user) throw new NotFoundException('USER_NOT_FOUND');
    if (!role) throw new NotFoundException('ROLE_NOT_FOUND');

    const existing = await this.prisma.userRole.findUnique({
      where: { userId_roleId: { userId, roleId: role.id } },
    });
    if (existing) throw new BadRequestException('ROLE_ALREADY_ASSIGNED');

    await this.prisma.$transaction([
      this.prisma.userRole.create({
        data: { userId, roleId: role.id, assignedBy },
      }),
      this.prisma.accountStatusLog.create({
        data: { userId, action: 'ROLE_ASSIGNED', performedBy: assignedBy, metadata: { role: roleType } },
      }),
    ]);
  }

  async revokeRole(userId: string, roleType: RoleType, performedBy: string): Promise<void> {
    const role = await this.prisma.role.findUnique({ where: { name: roleType } });
    if (!role) throw new NotFoundException('ROLE_NOT_FOUND');

    const userRole = await this.prisma.userRole.findUnique({
      where: { userId_roleId: { userId, roleId: role.id } },
    });
    if (!userRole) throw new NotFoundException('ROLE_NOT_ASSIGNED');

    await this.prisma.$transaction([
      this.prisma.userRole.delete({
        where: { userId_roleId: { userId, roleId: role.id } },
      }),
      this.prisma.accountStatusLog.create({
        data: { userId, action: 'ROLE_REVOKED', performedBy, metadata: { role: roleType } },
      }),
    ]);
  }

  async suspendUser(
    userId: string,
    reason: string,
    performedBy: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('USER_NOT_FOUND');
    if (user.status === 'SUSPENDED') throw new BadRequestException('ALREADY_SUSPENDED');

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { status: 'SUSPENDED' },
      }),
      this.prisma.accountStatusLog.create({
        data: { userId, action: 'SUSPENDED', reason, performedBy },
      }),
    ]);

    await this.tokenService.revokeAllUserSessions(userId);
    await this.emailService.sendAccountSuspended(user.email, user.fullName, reason);
  }

  async unsuspendUser(userId: string, performedBy: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('USER_NOT_FOUND');
    if (user.status !== 'SUSPENDED') throw new BadRequestException('NOT_SUSPENDED');

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { status: 'ACTIVE' },
      }),
      this.prisma.accountStatusLog.create({
        data: { userId, action: 'UNSUSPENDED', performedBy },
      }),
    ]);
  }

  // ─── DASHBOARD STATS ─────────────────────────────────────────────────────

  async getDashboardStats() {
    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      totalJobs,
      openJobs,
      hiddenJobs,
      totalBids,
      totalContracts,
      activeContracts,
      disputedContracts,
      completedContracts,
      revenueAgg,
      pendingReports,
      totalTransactions,
      failedTransactions,
      assessmentStats,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { status: 'ACTIVE', deletedAt: null } }),
      this.prisma.user.count({ where: { status: 'SUSPENDED' } }),
      this.prisma.job.count({ where: { deletedAt: null } }),
      this.prisma.job.count({ where: { status: 'OPEN', deletedAt: null, isHidden: false } }),
      this.prisma.job.count({ where: { isHidden: true, deletedAt: null } }),
      this.prisma.bid.count(),
      this.prisma.contract.count(),
      this.prisma.contract.count({ where: { status: 'ACTIVE' } }),
      this.prisma.contract.count({ where: { status: 'DISPUTED' } }),
      this.prisma.contract.count({ where: { status: 'COMPLETED' } }),
      this.prisma.transaction.aggregate({
        where: { status: 'SUCCESS', type: { in: ['EARNED', 'DEPOSIT'] } },
        _sum: { amount: true },
      }),
      this.prisma.report.count({ where: { status: { in: ['PENDING', 'IN_REVIEW'] } } }),
      this.prisma.transaction.count(),
      this.prisma.transaction.count({ where: { status: 'FAILED' } }),
      this.prisma.freelancerProfile.aggregate({
        where: { assessmentCompleted: true },
        _avg: { assessmentScore: true },
        _count: { assessmentScore: true },
      }),
    ]);

    const completionRate = totalContracts > 0
      ? Math.round((completedContracts / totalContracts) * 100)
      : 0;
    const disputeRate = totalContracts > 0
      ? Math.round((disputedContracts / totalContracts) * 100)
      : 0;

    return {
      users: { total: totalUsers, active: activeUsers, suspended: suspendedUsers },
      jobs: { total: totalJobs, open: openJobs, hidden: hiddenJobs },
      bids: { total: totalBids },
      contracts: {
        total: totalContracts,
        active: activeContracts,
        disputed: disputedContracts,
        completed: completedContracts,
        completionRate,
        disputeRate,
      },
      revenue: { total: revenueAgg._sum.amount ?? 0 },
      reports: { pending: pendingReports },
      transactions: { total: totalTransactions, failed: failedTransactions },
      assessment: {
        completedCount: assessmentStats._count.assessmentScore,
        averageScore: Math.round((assessmentStats._avg.assessmentScore ?? 0) * 10) / 10,
      },
    };
  }

  // ─── JOB MANAGEMENT ────────────────────────────────────────────────────────

  async listJobs(page = 1, limit = 20, search?: string, status?: string) {
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = { deletedAt: null };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;

    const [jobs, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        skip,
        take: limit,
        include: {
          client: { select: { id: true, fullName: true, email: true } },
          category: { select: { id: true, name: true } },
          _count: { select: { bids: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.job.count({ where }),
    ]);

    return { jobs, total, page, limit };
  }

  async hideJob(jobId: string, dto: HideJobDto, performedBy: string) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job || job.deletedAt) throw new NotFoundException('JOB_NOT_FOUND');

    return this.prisma.job.update({
      where: { id: jobId },
      data: { isHidden: true, hiddenReason: dto.reason, status: 'CLOSED' },
    });
  }

  async unhideJob(jobId: string) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job || job.deletedAt) throw new NotFoundException('JOB_NOT_FOUND');

    return this.prisma.job.update({
      where: { id: jobId },
      data: { isHidden: false, hiddenReason: null },
    });
  }

  async deleteJob(jobId: string) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job || job.deletedAt) throw new NotFoundException('JOB_NOT_FOUND');

    return this.prisma.job.update({
      where: { id: jobId },
      data: { deletedAt: new Date(), status: 'CLOSED', isHidden: true },
    });
  }

  // ─── REPORTS & DISPUTES ────────────────────────────────────────────────────

  async listReports(page = 1, limit = 20, status?: ReportStatus) {
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};

    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        skip,
        take: limit,
        include: {
          reporter: { select: { id: true, fullName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.report.count({ where }),
    ]);

    return { reports, total, page, limit };
  }

  async getReport(reportId: string) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      include: {
        reporter: { select: { id: true, fullName: true, email: true } },
      },
    });
    if (!report) throw new NotFoundException('REPORT_NOT_FOUND');

    let target: unknown = null;
    if (report.targetType === 'JOB') {
      target = await this.prisma.job.findUnique({
        where: { id: report.targetId },
        include: { client: { select: { id: true, fullName: true, email: true } } },
      });
    } else if (report.targetType === 'USER') {
      target = await this.prisma.user.findUnique({
        where: { id: report.targetId },
        select: { id: true, fullName: true, email: true, status: true },
      });
    } else if (report.targetType === 'CONTRACT') {
      target = await this.prisma.contract.findUnique({
        where: { id: report.targetId },
        include: {
          client: { select: { id: true, fullName: true, email: true } },
          freelancer: { select: { id: true, fullName: true, email: true } },
        },
      });
    }

    return { ...report, target };
  }

  async resolveReport(reportId: string, dto: ResolveReportDto, adminId: string) {
    const report = await this.prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundException('REPORT_NOT_FOUND');
    if (report.status === 'RESOLVED' || report.status === 'DISMISSED') {
      throw new BadRequestException('REPORT_ALREADY_RESOLVED');
    }

    if (dto.action === 'BAN_USER' && report.targetType === 'USER') {
      await this.suspendUser(report.targetId, dto.resolution ?? 'Banned via report resolution', adminId);
    } else if (dto.action === 'HIDE_JOB' && report.targetType === 'JOB') {
      await this.hideJob(report.targetId, { reason: dto.resolution ?? 'Hidden via report' }, adminId);
    } else if (dto.action === 'REFUND' && report.targetType === 'CONTRACT') {
      await this.releaseContractFunds(report.targetId, 'REFUND', adminId);
    } else if (dto.action === 'RELEASE_FUNDS' && report.targetType === 'CONTRACT') {
      await this.releaseContractFunds(report.targetId, 'RELEASE', adminId);
    }

    return this.prisma.report.update({
      where: { id: reportId },
      data: {
        status: dto.status,
        resolution: dto.resolution,
        action: dto.action ?? 'NONE',
        resolvedBy: adminId,
        resolvedAt: new Date(),
      },
    });
  }

  private async releaseContractFunds(contractId: string, mode: 'REFUND' | 'RELEASE', adminId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: { job: true },
    });
    if (!contract) throw new NotFoundException('CONTRACT_NOT_FOUND');

    const recipientId = mode === 'REFUND' ? contract.clientId : contract.freelancerId;
    let wallet = await this.prisma.wallet.findUnique({ where: { userId: recipientId } });
    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: { userId: recipientId, balance: 0, escrow: 0, totalEarned: 0 },
      });
    }

    const clientWallet = await this.prisma.wallet.findUnique({ where: { userId: contract.clientId } });
    const amount = contract.totalAmount;

    await this.prisma.$transaction([
      ...(clientWallet && clientWallet.escrow >= amount
        ? [
            this.prisma.wallet.update({
              where: { id: clientWallet.id },
              data: { escrow: { decrement: amount } },
            }),
          ]
        : []),
      this.prisma.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { increment: amount },
          ...(mode === 'RELEASE' ? { totalEarned: { increment: amount } } : {}),
        },
      }),
      this.prisma.transaction.create({
        data: {
          walletId: wallet.id,
          type: mode === 'REFUND' ? 'REFUND' : 'EARNED',
          amount,
          description: mode === 'REFUND'
            ? `Admin refund for contract ${contract.title}`
            : `Admin release funds for contract ${contract.title}`,
          status: 'SUCCESS' as TransactionStatus,
        },
      }),
      this.prisma.contract.update({
        where: { id: contractId },
        data: {
          status: mode === 'REFUND' ? 'CANCELLED' : 'COMPLETED',
          ...(mode === 'REFUND' ? { cancelledAt: new Date(), cancelReason: 'Admin refund' } : { completedAt: new Date() }),
        },
      }),
    ]);
  }

  // ─── CATEGORY & SKILL CRUD ─────────────────────────────────────────────────

  async listCategories(includeHidden = true) {
    return this.prisma.category.findMany({
      where: includeHidden ? {} : { isHidden: false },
      include: { _count: { select: { jobs: true, skills: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async createCategory(dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findUnique({ where: { name: dto.name } });
    if (existing) throw new BadRequestException('CATEGORY_ALREADY_EXISTS');
    return this.prisma.category.create({ data: dto });
  }

  async updateCategory(categoryId: string, dto: UpdateCategoryDto) {
    const cat = await this.prisma.category.findUnique({ where: { id: categoryId } });
    if (!cat) throw new NotFoundException('CATEGORY_NOT_FOUND');
    return this.prisma.category.update({ where: { id: categoryId }, data: dto });
  }

  async deleteCategory(categoryId: string) {
    const cat = await this.prisma.category.findUnique({
      where: { id: categoryId },
      include: { _count: { select: { jobs: true } } },
    });
    if (!cat) throw new NotFoundException('CATEGORY_NOT_FOUND');
    if (cat._count.jobs > 0) throw new BadRequestException('CATEGORY_HAS_JOBS');
    return this.prisma.category.delete({ where: { id: categoryId } });
  }

  async listSkills(includeHidden = true) {
    return this.prisma.skill.findMany({
      where: includeHidden ? {} : { isHidden: false },
      include: { category: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async createSkill(dto: CreateSkillDto) {
    const existing = await this.prisma.skill.findUnique({ where: { name: dto.name } });
    if (existing) throw new BadRequestException('SKILL_ALREADY_EXISTS');
    return this.prisma.skill.create({ data: dto });
  }

  async updateSkill(skillId: string, dto: UpdateSkillDto) {
    const skill = await this.prisma.skill.findUnique({ where: { id: skillId } });
    if (!skill) throw new NotFoundException('SKILL_NOT_FOUND');
    return this.prisma.skill.update({ where: { id: skillId }, data: dto });
  }

  async deleteSkill(skillId: string) {
    const skill = await this.prisma.skill.findUnique({ where: { id: skillId } });
    if (!skill) throw new NotFoundException('SKILL_NOT_FOUND');
    return this.prisma.skill.delete({ where: { id: skillId } });
  }

  async mergeSkills(dto: MergeSkillsDto) {
    if (dto.sourceSkillId === dto.targetSkillId) {
      throw new BadRequestException('CANNOT_MERGE_SAME_SKILL');
    }
    const [source, target] = await Promise.all([
      this.prisma.skill.findUnique({ where: { id: dto.sourceSkillId } }),
      this.prisma.skill.findUnique({ where: { id: dto.targetSkillId } }),
    ]);
    if (!source || !target) throw new NotFoundException('SKILL_NOT_FOUND');

    await this.prisma.$transaction([
      this.prisma.assessmentQuestion.updateMany({
        where: { skillId: source.id },
        data: { skillId: target.id },
      }),
      this.prisma.skill.delete({ where: { id: source.id } }),
    ]);

    return target;
  }

  // ─── TRANSACTION MANAGEMENT ────────────────────────────────────────────────

  async listTransactions(page = 1, limit = 20, status?: string, type?: string) {
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        include: {
          wallet: {
            include: {
              user: { select: { id: true, fullName: true, email: true } },
            },
          },
        },
        orderBy: { date: 'desc' },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return { transactions, total, page, limit };
  }

  async adminRefund(transactionId: string, reason: string, adminId: string) {
    const tx = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { wallet: true },
    });
    if (!tx) throw new NotFoundException('TRANSACTION_NOT_FOUND');
    if (tx.status !== 'SUCCESS') throw new BadRequestException('CAN_ONLY_REFUND_SUCCESS_TX');

    await this.prisma.$transaction([
      this.prisma.wallet.update({
        where: { id: tx.walletId },
        data: { balance: { increment: tx.amount } },
      }),
      this.prisma.transaction.create({
        data: {
          walletId: tx.walletId,
          type: 'REFUND',
          amount: tx.amount,
          description: reason || `Admin refund for transaction ${transactionId}`,
          status: 'SUCCESS',
        },
      }),
    ]);

    return { success: true };
  }

  // ─── SYSTEM CONFIG ─────────────────────────────────────────────────────────

  async getSystemConfigs() {
    return this.prisma.systemConfig.findMany({ orderBy: { key: 'asc' } });
  }

  async updateSystemConfig(key: string, value: string, adminId: string) {
    const config = await this.prisma.systemConfig.findUnique({ where: { key } });
    if (!config) throw new NotFoundException('CONFIG_NOT_FOUND');
    return this.prisma.systemConfig.update({
      where: { key },
      data: { value, updatedBy: adminId },
    });
  }

  async bulkUpdateSystemConfigs(dto: BulkUpdateSystemConfigDto, adminId: string) {
    const results = await Promise.all(
      dto.configs.map((c) =>
        this.prisma.systemConfig.upsert({
          where: { key: c.key },
          update: { value: c.value, updatedBy: adminId },
          create: { key: c.key, value: c.value, updatedBy: adminId },
        }),
      ),
    );
    return results;
  }

  // ─── SKILL ASSESSMENT MANAGEMENT ───────────────────────────────────────────

  async listAssessmentQuestions() {
    return this.prisma.assessmentQuestion.findMany({
      include: { skill: { select: { id: true, name: true } } },
      orderBy: { order: 'asc' },
    });
  }

  async createAssessmentQuestion(dto: CreateAssessmentQuestionDto) {
    if (dto.correctIndex >= dto.options.length) {
      throw new BadRequestException('INVALID_CORRECT_INDEX');
    }
    return this.prisma.assessmentQuestion.create({
      data: {
        skillId: dto.skillId,
        question: dto.question,
        options: dto.options,
        correctIndex: dto.correctIndex,
        type: dto.type ?? 'mcq',
        order: dto.order ?? 0,
      },
    });
  }

  async updateAssessmentQuestion(questionId: string, dto: UpdateAssessmentQuestionDto) {
    const q = await this.prisma.assessmentQuestion.findUnique({ where: { id: questionId } });
    if (!q) throw new NotFoundException('QUESTION_NOT_FOUND');
    if (dto.options && dto.correctIndex !== undefined && dto.correctIndex >= dto.options.length) {
      throw new BadRequestException('INVALID_CORRECT_INDEX');
    }
    return this.prisma.assessmentQuestion.update({ where: { id: questionId }, data: dto });
  }

  async deleteAssessmentQuestion(questionId: string) {
    const q = await this.prisma.assessmentQuestion.findUnique({ where: { id: questionId } });
    if (!q) throw new NotFoundException('QUESTION_NOT_FOUND');
    return this.prisma.assessmentQuestion.delete({ where: { id: questionId } });
  }

  async getAssessmentStats() {
    const profiles = await this.prisma.freelancerProfile.findMany({
      where: { assessmentCompleted: true },
      select: { assessmentScore: true, assessmentLevel: true },
    });

    const distribution: Record<string, number> = { Beginner: 0, Intermediate: 0, Expert: 0 };
    const scoreDistribution: Record<number, number> = {};

    for (const p of profiles) {
      const level = p.assessmentLevel ?? 'Beginner';
      distribution[level] = (distribution[level] ?? 0) + 1;
      const score = p.assessmentScore ?? 0;
      scoreDistribution[score] = (scoreDistribution[score] ?? 0) + 1;
    }

    return {
      totalCompleted: profiles.length,
      levelDistribution: distribution,
      scoreDistribution,
      averageScore: profiles.length
        ? Math.round((profiles.reduce((s, p) => s + (p.assessmentScore ?? 0), 0) / profiles.length) * 10) / 10
        : 0,
    };
  }

  async listDisputedContracts(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = { status: 'DISPUTED' as const };

    const [contracts, total] = await Promise.all([
      this.prisma.contract.findMany({
        where,
        skip,
        take: limit,
        include: {
          client: { select: { id: true, fullName: true, email: true } },
          freelancer: { select: { id: true, fullName: true, email: true } },
          job: { select: { id: true, title: true } },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.contract.count({ where }),
    ]);

    return { contracts, total, page, limit };
  }
}
