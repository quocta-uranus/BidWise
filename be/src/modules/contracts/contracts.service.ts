import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitDeliverableDto } from './dto/submit-deliverable.dto';

@Injectable()
export class ContractsService {
  constructor(private readonly prisma: PrismaService) {}

  async createContract(clientId: string, bidId: string) {
    const bid = await this.prisma.bid.findUnique({
      where: { id: bidId },
      include: { job: true },
    });

    if (!bid || bid.status !== 'PENDING') {
      throw new BadRequestException('Đề xuất thầu không hợp lệ hoặc đã được xử lý.');
    }

    // Get client wallet
    let wallet = await this.prisma.wallet.findUnique({
      where: { userId: clientId },
    });

    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: {
          userId: clientId,
          balance: 0,
          escrow: 0,
          totalEarned: 0,
        },
      });
    }

    if (wallet.balance < bid.amount) {
      throw new BadRequestException('INSUFFICIENT_FUNDS');
    }

    const m1Amount = Math.round(bid.amount * 0.3);
    const m2Amount = Math.round(bid.amount * 0.4);
    const m3Amount = bid.amount - m1Amount - m2Amount;

    return this.prisma.$transaction(async (tx) => {
      // Lock balance in escrow
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { decrement: bid.amount },
          escrow: { increment: bid.amount },
        },
      });

      // Create transaction log
      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'ESCROW',
          amount: bid.amount,
          description: `Ký quỹ hợp đồng: ${bid.job.title}`,
          descKey: 'escrow',
          descParams: { jobId: bid.jobId },
          status: 'SUCCESS',
        },
      });

      // Create contract
      const contract = await tx.contract.create({
        data: {
          jobId: bid.jobId,
          freelancerId: bid.freelancerId,
          amount: bid.amount,
          status: 'SIGNED',
          milestones: {
            create: [
              { name: 'design', nameKey: 'design', amount: m1Amount, progress: 0, status: 'PENDING' },
              { name: 'coding', nameKey: 'coding', amount: m2Amount, progress: 0, status: 'PENDING' },
              { name: 'delivery', nameKey: 'delivery', amount: m3Amount, progress: 0, status: 'PENDING' },
            ],
          },
        },
        include: {
          milestones: true,
          job: true,
        },
      });

      // Update bid status
      await tx.bid.update({
        where: { id: bidId },
        data: { status: 'ACCEPTED' },
      });

      // Reject all other bids for this job
      await tx.bid.updateMany({
        where: { jobId: bid.jobId, id: { not: bidId } },
        data: { status: 'REJECTED' },
      });

      // Update job status to IN_PROGRESS
      await tx.job.update({
        where: { id: bid.jobId },
        data: { status: 'IN_PROGRESS' },
      });

      return contract;
    });
  }

  async signContract(userId: string, contractId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract || contract.freelancerId !== userId) {
      throw new BadRequestException('Hợp đồng không hợp lệ hoặc bạn không có quyền ký.');
    }

    if (contract.status !== 'SIGNED') {
      throw new BadRequestException('Hợp đồng đã được ký hoặc đã hoàn thành.');
    }

    return this.prisma.contract.update({
      where: { id: contractId },
      data: { status: 'ACTIVE' },
      include: { milestones: true, job: true },
    });
  }

  async updateMilestoneProgress(userId: string, contractId: string, milestoneId: string, progress: number) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract || contract.freelancerId !== userId) {
      throw new BadRequestException('Không tìm thấy hợp đồng hoặc bạn không có quyền cập nhật.');
    }

    return this.prisma.milestone.update({
      where: { id: milestoneId },
      data: { progress },
    });
  }

  async submitMilestone(userId: string, contractId: string, milestoneId: string, submitDto: SubmitDeliverableDto) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract || contract.freelancerId !== userId) {
      throw new BadRequestException('Không tìm thấy hợp đồng hoặc bạn không có quyền nộp.');
    }

    return this.prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        progress: 100,
        status: 'SUBMITTED',
        deliverable: submitDto.fileName,
        deliverableDesc: submitDto.description,
        submittedAt: new Date(),
      },
    });
  }

  async approveMilestone(clientId: string, contractId: string, milestoneId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: { job: true },
    });

    if (!contract || contract.job.clientId !== clientId) {
      throw new BadRequestException('Hợp đồng không hợp lệ.');
    }

    const milestone = await this.prisma.milestone.findUnique({
      where: { id: milestoneId },
    });

    if (!milestone || milestone.status !== 'SUBMITTED') {
      throw new BadRequestException('Mốc thanh toán không ở trạng thái chờ phê duyệt.');
    }

    // Get client wallet
    const clientWallet = await this.prisma.wallet.findUnique({
      where: { userId: clientId },
    });

    // Get or create freelancer wallet
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

    return this.prisma.$transaction(async (tx) => {
      // Update milestone status
      const updatedMs = await tx.milestone.update({
        where: { id: milestoneId },
        data: { status: 'ACCEPTED' },
      });

      // Deduct client escrow
      if (clientWallet) {
        await tx.wallet.update({
          where: { id: clientWallet.id },
          data: { escrow: { decrement: milestone.amount } },
        });
      }

      // Add to freelancer balance
      await tx.wallet.update({
        where: { id: freelancerWallet.id },
        data: {
          balance: { increment: milestone.amount },
          totalEarned: { increment: milestone.amount },
        },
      });

      // Create transaction for freelancer
      await tx.transaction.create({
        data: {
          walletId: freelancerWallet.id,
          type: 'EARNED',
          amount: milestone.amount,
          description: `Nghiệm thu cột mốc: ${milestone.name}`,
          descKey: 'milestoneApproved',
          descParams: {
            jobId: contract.jobId,
            milestoneKey: milestone.nameKey || 'design',
          },
          status: 'SUCCESS',
        },
      });

      // If clientWallet exists, create transaction logs for client as well (outbound EARNED)
      if (clientWallet) {
        await tx.transaction.create({
          data: {
            walletId: clientWallet.id,
            type: 'EARNED',
            amount: milestone.amount,
            description: `Giải ngân cột mốc: ${milestone.name}`,
            descKey: 'milestoneApproved',
            descParams: {
              jobId: contract.jobId,
              milestoneKey: milestone.nameKey || 'design',
            },
            status: 'SUCCESS',
          },
        });
      }

      // Check if all milestones are accepted
      const allMilestones = await tx.milestone.findMany({
        where: { contractId },
      });

      const allCompleted = allMilestones.every((m) =>
        m.id === milestoneId ? true : m.status === 'ACCEPTED'
      );

      if (allCompleted) {
        await tx.contract.update({
          where: { id: contractId },
          data: { status: 'COMPLETED' },
        });

        await tx.job.update({
          where: { id: contract.jobId },
          data: { status: 'COMPLETED' },
        });
      }

      return updatedMs;
    });
  }

  async requestRefund(clientId: string, contractId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: { job: true, milestones: true },
    });

    if (!contract || contract.job.clientId !== clientId) {
      throw new BadRequestException('Hợp đồng không hợp lệ hoặc bạn không phải là chủ dự án.');
    }

    if (contract.status === 'COMPLETED') {
      throw new BadRequestException('Hợp đồng đã hoàn thành, không thể yêu cầu hoàn tiền.');
    }

    const unreleasedMilestones = contract.milestones.filter((m) => m.status !== 'ACCEPTED');
    const unreleasedAmount = unreleasedMilestones.reduce((sum, m) => sum + m.amount, 0);

    if (unreleasedAmount <= 0) {
      throw new BadRequestException('Không có số dư ký quỹ nào chưa giải ngân.');
    }

    const clientWallet = await this.prisma.wallet.findUnique({
      where: { userId: clientId },
    });

    if (!clientWallet) {
      throw new BadRequestException('Ví khách hàng không tồn tại.');
    }

    return this.prisma.$transaction(async (tx) => {
      // Refund to client wallet
      await tx.wallet.update({
        where: { id: clientWallet.id },
        data: {
          balance: { increment: unreleasedAmount },
          escrow: { decrement: unreleasedAmount },
        },
      });

      // Create transaction log
      await tx.transaction.create({
        data: {
          walletId: clientWallet.id,
          type: 'REFUND',
          amount: unreleasedAmount,
          description: `Hoàn trả ký quỹ hợp đồng: ${contract.job.title}`,
          descKey: 'refund',
          descParams: { jobId: contract.jobId },
          status: 'SUCCESS',
        },
      });

      // Update remaining milestones to PENDING, progress = 0
      await tx.milestone.updateMany({
        where: { contractId, status: { not: 'ACCEPTED' } },
        data: { progress: 0, status: 'PENDING' },
      });

      // Update contract status to COMPLETED
      await tx.contract.update({
        where: { id: contractId },
        data: { status: 'COMPLETED' },
      });

      // Close job status
      await tx.job.update({
        where: { id: contract.jobId },
        data: { status: 'CLOSED' },
      });

      return { success: true };
    });
  }

  async getContracts(userId: string) {
    return this.prisma.contract.findMany({
      where: {
        OR: [
          { job: { clientId: userId } },
          { freelancerId: userId },
        ],
      },
      include: {
        milestones: {
          orderBy: { createdAt: 'asc' },
        },
        job: {
          include: {
            client: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async reviewClient(contractId: string, clientReviewed: boolean) {
    return this.prisma.contract.update({
      where: { id: contractId },
      data: { clientReviewed },
    });
  }
}
