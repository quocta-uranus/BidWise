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
import { ReviewFreelancerDto } from './dto/review-freelancer.dto';
import { join, extname } from 'path';
import { existsSync, mkdirSync, writeFileSync, readdirSync, unlinkSync, createReadStream } from 'fs';
import { randomUUID } from 'crypto';
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
      let clientWallet = await tx.wallet.findUnique({
        where: { userId: clientId },
      });
      if (!clientWallet) {
        clientWallet = await tx.wallet.create({
          data: { userId: clientId, balance: 0, escrow: 0, totalEarned: 0 },
        });
      }

      if (clientWallet.balance < totalAmount) {
        throw new BadRequestException('INSUFFICIENT_FUNDS_FOR_ESCROW');
      }

      await tx.wallet.update({
        where: { id: clientWallet.id },
        data: {
          balance: { decrement: totalAmount },
          escrow: { increment: totalAmount },
        },
      });

      await tx.transaction.create({
        data: {
          walletId: clientWallet.id,
          type: 'ESCROW',
          amount: totalAmount,
          description: `Ký quỹ hợp đồng: ${bid.job.title}`,
          descKey: 'escrowLock',
          descParams: {
            jobId: bid.jobId,
          },
          status: 'SUCCESS',
        },
      });

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
        milestones: {
          orderBy: { order: 'asc' },
          include: { deliverables: { orderBy: { uploadedAt: 'desc' } } },
        },
        client: { select: { id: true, fullName: true, avatarUrl: true } },
        freelancer: { select: { id: true, fullName: true, avatarUrl: true } },
        job: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // FL-22: Freelancer submits a milestone (Modified for actual file upload)
  async submitMilestone(
    contractId: string,
    milestoneId: string,
    freelancerId: string,
    description: string,
    file: any,
  ) {
    const { contract, milestone } = await this.getMilestoneForFreelancer(contractId, milestoneId, freelancerId);

    if (!['NOT_STARTED', 'IN_PROGRESS', 'REJECTED', 'REVISION_REQUESTED'].includes(milestone.status)) {
      throw new BadRequestException('MILESTONE_CANNOT_BE_SUBMITTED');
    }

    if (!file) {
      throw new BadRequestException('Vui lòng chọn file để nộp.');
    }

    const autoApproveAt = new Date();
    autoApproveAt.setDate(autoApproveAt.getDate() + contract.autoApprovalDays);

    const dir = join(process.cwd(), 'uploads', 'contracts', contractId, 'milestones', milestoneId);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    } else {
      try {
        const files = readdirSync(dir);
        for (const f of files) {
          unlinkSync(join(dir, f));
        }
      } catch (err) {
        // ignore
      }
    }

    const ext = extname(file.originalname).toLowerCase() || '.bin';
    const storedName = `${randomUUID()}${ext}`;
    const storagePath = join(dir, storedName);
    writeFileSync(storagePath, file.buffer);

    return this.prisma.$transaction(async (tx) => {
      // Clear any previous deliverables
      await tx.milestoneDeliverable.deleteMany({
        where: { milestoneId }
      });

      // Create new deliverable record
      const deliverable = await tx.milestoneDeliverable.create({
        data: {
          milestoneId,
          fileName: file.originalname,
          fileUrl: `/api/v1/contracts/${contractId}/milestones/${milestoneId}/download`,
          fileSize: file.size,
          mimeType: file.mimetype,
          description: description || '',
        }
      });

      const updated = await tx.milestone.update({
        where: { id: milestoneId },
        data: {
          status: 'SUBMITTED',
          submittedAt: new Date(),
          freelancerNotes: description || '',
          autoApproveAt,
        },
        include: { deliverables: true },
      });
      return updated;
    });
  }

  // Secure deliverable downloader
  async downloadDeliverable(
    userId: string,
    contractId: string,
    milestoneId: string,
    res: any,
  ) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      throw new NotFoundException('Không tìm thấy hợp đồng.');
    }

    const isAuthorized = contract.freelancerId === userId || contract.clientId === userId;
    if (!isAuthorized) {
      throw new ForbiddenException('Bạn không có quyền tải file này.');
    }

    const milestone = await this.prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: { deliverables: true },
    });

    if (!milestone || milestone.deliverables.length === 0) {
      throw new NotFoundException('Không tìm thấy file nộp bài cho cột mốc này.');
    }

    const deliverable = milestone.deliverables[0];
    const dir = join(process.cwd(), 'uploads', 'contracts', contractId, 'milestones', milestoneId);
    if (!existsSync(dir)) {
      throw new NotFoundException('Thư mục file không tồn tại trên hệ thống.');
    }

    const files = readdirSync(dir);
    if (files.length === 0) {
      throw new NotFoundException('File đã bị xóa hoặc không tìm thấy trên đĩa.');
    }

    const filePath = join(dir, files[0]);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(deliverable.fileName)}"`);
    createReadStream(filePath).pipe(res);
  }

  // CL-21: Client reviews a milestone (With payment/escrow integration)
  async reviewMilestone(contractId: string, milestoneId: string, clientId: string, dto: ReviewMilestoneDto) {
    const { contract, milestone } = await this.getMilestoneForClient(contractId, milestoneId, clientId);

    if (contract.status === 'DISPUTED') {
      throw new BadRequestException('ESCROW_FROZEN_BY_DISPUTE');
    }

    if (milestone.status !== 'SUBMITTED') {
      throw new BadRequestException('MILESTONE_NOT_SUBMITTED');
    }

    if (dto.action === 'APPROVED') {
      const clientWallet = await this.prisma.wallet.findUnique({
        where: { userId: clientId },
      });

      let freelancerWallet = await this.prisma.wallet.findUnique({
        where: { userId: contract.freelancerId },
      });

      if (!freelancerWallet) {
        freelancerWallet = await this.prisma.wallet.create({
          data: {
            userId: contract.freelancerId,
            balance: 0,
            escrow: 0,
            totalEarned: 0,
          },
        });
      }

      const updated = await this.prisma.$transaction(async (tx) => {
        const m = await tx.milestone.update({
          where: { id: milestoneId },
          data: {
            status: 'APPROVED',
            approvedAt: new Date(),
            clientFeedback: dto.feedback,
          },
        });

        // Escrow deduction & freelancer crediting
        if (clientWallet) {
          await tx.wallet.update({
            where: { id: clientWallet.id },
            data: { escrow: { decrement: milestone.amount } },
          });
        }

        await tx.wallet.update({
          where: { id: freelancerWallet.id },
          data: {
            balance: { increment: milestone.amount },
            totalEarned: { increment: milestone.amount },
          },
        });

        // Transaction logs for freelancer
        await tx.transaction.create({
          data: {
            walletId: freelancerWallet.id,
            type: 'EARNED',
            amount: milestone.amount,
            description: `Nghiệm thu cột mốc: ${milestone.title}`,
            descKey: 'milestoneApproved',
            descParams: {
              jobId: contract.jobId,
              milestoneKey: milestone.title,
            },
            status: 'SUCCESS',
          },
        });

        // Transaction logs for client
        if (clientWallet) {
          await tx.transaction.create({
            data: {
              walletId: clientWallet.id,
              type: 'EARNED',
              amount: milestone.amount,
              description: `Giải ngân cột mốc: ${milestone.title}`,
              descKey: 'milestoneApproved',
              descParams: {
                jobId: contract.jobId,
                milestoneKey: milestone.title,
              },
              status: 'SUCCESS',
            },
          });
        }

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

  // Client reviews Freelancer
  async reviewFreelancer(clientId: string, contractId: string, dto: ReviewFreelancerDto) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract || contract.clientId !== clientId) {
      throw new BadRequestException('Hợp đồng không hợp lệ hoặc bạn không phải là chủ dự án.');
    }

    if (contract.status !== 'COMPLETED') {
      throw new BadRequestException('Chỉ có thể đánh giá sau khi hợp đồng đã hoàn thành.');
    }

    if (contract.freelancerReviewed) {
      throw new BadRequestException('Bạn đã đánh giá freelancer cho hợp đồng này rồi.');
    }

    return this.prisma.$transaction(async (tx) => {
      // Create Review
      const review = await tx.review.create({
        data: {
          contractId,
          reviewerId: clientId,
          revieweeId: contract.freelancerId,
          qualityRating: dto.qualityRating,
          commRating: dto.commRating,
          speedRating: dto.speedRating,
          comment: dto.comment || '',
          anonymous: dto.anonymous || false,
        },
      });

      // Update contract
      await tx.contract.update({
        where: { id: contractId },
        data: { freelancerReviewed: true },
      });

      return { success: true, reviewId: review.id };
    });
  }

  // Freelancer reviews Client
  async reviewClient(freelancerId: string, contractId: string, dto: ReviewFreelancerDto) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract || contract.freelancerId !== freelancerId) {
      throw new BadRequestException('Hợp đồng không hợp lệ hoặc bạn không phải là freelancer của dự án.');
    }

    if (contract.status !== 'COMPLETED') {
      throw new BadRequestException('Chỉ có thể đánh giá sau khi hợp đồng đã hoàn thành.');
    }

    if (contract.clientReviewed) {
      throw new BadRequestException('Bạn đã đánh giá client cho hợp đồng này rồi.');
    }

    return this.prisma.$transaction(async (tx) => {
      // Create Review
      const review = await tx.review.create({
        data: {
          contractId,
          reviewerId: freelancerId,
          revieweeId: contract.clientId,
          qualityRating: dto.qualityRating,
          commRating: dto.commRating,
          speedRating: dto.speedRating,
          comment: dto.comment || '',
          anonymous: dto.anonymous || false,
        },
      });

      // Update contract
      await tx.contract.update({
        where: { id: contractId },
        data: { clientReviewed: true },
      });

      return { success: true, reviewId: review.id };
    });
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
    if (contract.status === 'DISPUTED') {
      throw new BadRequestException('DISPUTE_MUST_BE_RESOLVED_BY_ADMIN');
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
