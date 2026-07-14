import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ContractStatus, MilestoneStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CancelContractDto,
  CreateContractDto,
  ReviewMilestoneDto,
  SubmitMilestoneDto,
} from './dto/contracts.dto';
import { ReputationService } from '../reputation/reputation.service';

@Injectable()
export class ContractsService {
  constructor(
    private prisma: PrismaService,
    private reputationService: ReputationService,
  ) {}

  async createContract(clientId: string, dto: CreateContractDto) {
    const bid = await this.prisma.bid.findUnique({
      where: { id: dto.bidId },
      include: {
        job: { select: { id: true, clientId: true, title: true } },
        freelancer: { select: { id: true, fullName: true } },
      },
    });

    if (!bid) throw new NotFoundException('BID_NOT_FOUND');
    if (bid.job.clientId !== clientId) throw new ForbiddenException('NOT_JOB_OWNER');
    if (bid.status !== 'ACCEPTED') throw new BadRequestException('BID_NOT_ACCEPTED');

    const existing = await this.prisma.contract.findUnique({ where: { bidId: dto.bidId } });
    if (existing) throw new BadRequestException('CONTRACT_ALREADY_EXISTS');

    const totalPct = dto.milestones.reduce((s, m) => s + m.percentage, 0);
    if (Math.abs(totalPct - 100) > 0.01) {
      throw new BadRequestException('MILESTONE_PERCENTAGES_MUST_SUM_100');
    }

    const totalAmount = Number(bid.amount);
    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      const contract = await tx.contract.create({
        data: {
          jobId: bid.jobId,
          bidId: bid.id,
          clientId,
          freelancerId: bid.freelancerId,
          title: bid.job.title,
          description: dto.description,
          totalAmount,
          customTerms: dto.customTerms,
          status: 'ACTIVE',
          startDate: now,
          milestones: {
            create: dto.milestones.map((m) => ({
              order: m.order,
              title: m.title,
              description: m.description,
              amount: Math.round((m.percentage / 100) * totalAmount * 100) / 100,
              percentage: m.percentage,
              deadline: new Date(m.deadline),
              maxRevisions: m.maxRevisions ?? 3,
            })),
          },
        },
        include: {
          milestones: { orderBy: { order: 'asc' } },
          client: { select: { id: true, fullName: true } },
          freelancer: { select: { id: true, fullName: true } },
        },
      });

      await tx.contractStatusLog.create({
        data: {
          contractId: contract.id,
          action: 'CREATED',
          toStatus: 'ACTIVE',
          performedBy: clientId,
        },
      });

      return contract;
    });
  }

  async getContract(contractId: string, userId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        milestones: {
          orderBy: { order: 'asc' },
          include: { deliverables: { orderBy: { uploadedAt: 'desc' } } },
        },
        client: { select: { id: true, fullName: true, avatarUrl: true } },
        freelancer: { select: { id: true, fullName: true, avatarUrl: true } },
        job: { select: { id: true, title: true, status: true } },
        statusLogs: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });

    if (!contract) throw new NotFoundException('CONTRACT_NOT_FOUND');
    if (contract.clientId !== userId && contract.freelancerId !== userId) {
      throw new ForbiddenException('NOT_CONTRACT_PARTY');
    }

    return contract;
  }

  async listContracts(userId: string, role: 'client' | 'freelancer', status?: ContractStatus) {
    const where: any = {
      ...(role === 'client' ? { clientId: userId } : { freelancerId: userId }),
      ...(status ? { status } : {}),
    };

    return this.prisma.contract.findMany({
      where,
      include: {
        milestones: { orderBy: { order: 'asc' }, select: { id: true, title: true, status: true, deadline: true, amount: true, percentage: true } },
        client: { select: { id: true, fullName: true, avatarUrl: true } },
        freelancer: { select: { id: true, fullName: true, avatarUrl: true } },
        job: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // CL-21 / FL-22: Freelancer submits a milestone
  async submitMilestone(contractId: string, milestoneId: string, freelancerId: string, dto: SubmitMilestoneDto) {
    const { contract, milestone } = await this.getMilestoneForFreelancer(contractId, milestoneId, freelancerId);

    if (!['NOT_STARTED', 'IN_PROGRESS', 'REJECTED', 'REVISION_REQUESTED'].includes(milestone.status)) {
      throw new BadRequestException('MILESTONE_CANNOT_BE_SUBMITTED');
    }

    const autoApproveAt = new Date();
    autoApproveAt.setDate(autoApproveAt.getDate() + contract.autoApprovalDays);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.milestone.update({
        where: { id: milestoneId },
        data: {
          status: 'SUBMITTED',
          submittedAt: new Date(),
          freelancerNotes: dto.freelancerNotes,
          autoApproveAt,
          ...(dto.deliverables?.length
            ? {
                deliverables: {
                  create: dto.deliverables.map((d) => ({
                    fileName: d.fileName,
                    fileUrl: d.fileUrl,
                    fileSize: d.fileSize,
                    mimeType: d.mimeType,
                    description: d.description,
                  })),
                },
              }
            : {}),
        },
        include: { deliverables: true },
      });
      return updated;
    });
  }

  // CL-21: Client reviews a milestone
  async reviewMilestone(contractId: string, milestoneId: string, clientId: string, dto: ReviewMilestoneDto) {
    const { contract, milestone } = await this.getMilestoneForClient(contractId, milestoneId, clientId);

    if (milestone.status !== 'SUBMITTED') {
      throw new BadRequestException('MILESTONE_NOT_SUBMITTED');
    }

    if (dto.action === 'APPROVED') {
      const updated = await this.prisma.$transaction(async (tx) => {
        const m = await tx.milestone.update({
          where: { id: milestoneId },
          data: {
            status: 'APPROVED',
            approvedAt: new Date(),
            clientFeedback: dto.feedback,
          },
        });

        // Check if all milestones are approved → complete contract
        const allMilestones = await tx.milestone.findMany({ where: { contractId } });
        const allApproved = allMilestones.every(
          (ms) => ms.id === milestoneId || ms.status === 'APPROVED',
        );

        if (allApproved) {
          await tx.contract.update({
            where: { id: contractId },
            data: { status: 'COMPLETED', completedAt: new Date() },
          });
          await tx.contractStatusLog.create({
            data: {
              contractId,
              action: 'COMPLETED',
              fromStatus: 'ACTIVE',
              toStatus: 'COMPLETED',
              performedBy: clientId,
            },
          });
        }

        await tx.contractStatusLog.create({
          data: {
            contractId,
            action: 'MILESTONE_APPROVED',
            toStatus: contract.status as ContractStatus,
            performedBy: clientId,
            metadata: { milestoneId },
          },
        });

        return m;
      });
      // Fire-and-forget: update multi-dimensional reputation after milestone approved
      if (dto.rating) {
        this.prisma.job
          .findUnique({ where: { id: contract.jobId }, select: { skills: true } })
          .then((job) => {
            if (job) {
              this.reputationService.updateAfterReview(contract.freelancerId, job.skills, dto.rating!);
            }
          })
          .catch(() => void 0);
      }

      return updated;
    }

    if (dto.action === 'REJECTED' || dto.action === 'REVISION_REQUESTED') {
      if (dto.action === 'REJECTED' && milestone.revisionCount >= milestone.maxRevisions) {
        throw new BadRequestException('MAX_REVISIONS_EXCEEDED');
      }

      return this.prisma.milestone.update({
        where: { id: milestoneId },
        data: {
          status: dto.action === 'REJECTED' ? 'REJECTED' : 'REVISION_REQUESTED',
          rejectedAt: dto.action === 'REJECTED' ? new Date() : undefined,
          clientFeedback: dto.feedback,
          revisionCount: { increment: 1 },
        },
      });
    }

    throw new BadRequestException('INVALID_REVIEW_ACTION');
  }

  // CL-22: Cancel contract
  async cancelContract(contractId: string, userId: string, dto: CancelContractDto) {
    const contract = await this.prisma.contract.findUnique({ where: { id: contractId } });
    if (!contract) throw new NotFoundException('CONTRACT_NOT_FOUND');
    if (contract.clientId !== userId && contract.freelancerId !== userId) {
      throw new ForbiddenException('NOT_CONTRACT_PARTY');
    }
    if (['COMPLETED', 'CANCELLED'].includes(contract.status)) {
      throw new BadRequestException('CONTRACT_ALREADY_FINISHED');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.contract.update({
        where: { id: contractId },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelReason: dto.reason,
        },
      });

      await tx.contractStatusLog.create({
        data: {
          contractId,
          action: 'CANCELLED',
          fromStatus: contract.status as ContractStatus,
          toStatus: 'CANCELLED',
          reason: dto.reason,
          performedBy: userId,
        },
      });

      // Reset job status back to CLOSED
      await tx.job.update({
        where: { id: contract.jobId },
        data: { status: 'CLOSED' },
      });

      // Reset accepted bid to REJECTED
      await tx.bid.update({
        where: { id: contract.bidId },
        data: { status: 'REJECTED' },
      });

      return updated;
    });
  }

  // FL-20: Freelancer updates milestone progress notes
  async updateMilestoneProgress(contractId: string, milestoneId: string, freelancerId: string, notes: string) {
    const { milestone } = await this.getMilestoneForFreelancer(contractId, milestoneId, freelancerId);

    if (['APPROVED', 'SUBMITTED'].includes(milestone.status)) {
      throw new BadRequestException('MILESTONE_NOT_EDITABLE');
    }

    return this.prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        freelancerNotes: notes,
        status: milestone.status === 'NOT_STARTED' ? 'IN_PROGRESS' : milestone.status,
      },
    });
  }

  private async getMilestoneForClient(contractId: string, milestoneId: string, clientId: string) {
    const contract = await this.prisma.contract.findUnique({ where: { id: contractId } });
    if (!contract) throw new NotFoundException('CONTRACT_NOT_FOUND');
    if (contract.clientId !== clientId) throw new ForbiddenException('NOT_CONTRACT_CLIENT');

    const milestone = await this.prisma.milestone.findFirst({ where: { id: milestoneId, contractId } });
    if (!milestone) throw new NotFoundException('MILESTONE_NOT_FOUND');

    return { contract, milestone };
  }

  private async getMilestoneForFreelancer(contractId: string, milestoneId: string, freelancerId: string) {
    const contract = await this.prisma.contract.findUnique({ where: { id: contractId } });
    if (!contract) throw new NotFoundException('CONTRACT_NOT_FOUND');
    if (contract.freelancerId !== freelancerId) throw new ForbiddenException('NOT_CONTRACT_FREELANCER');

    const milestone = await this.prisma.milestone.findFirst({ where: { id: milestoneId, contractId } });
    if (!milestone) throw new NotFoundException('MILESTONE_NOT_FOUND');

    return { contract, milestone };
  }
}
