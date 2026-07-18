import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto, OpenDisputeDto, SubmitEvidenceDto } from './dto/reports.dto';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async createReport(reporterId: string, dto: CreateReportDto) {
    const report = await this.prisma.report.create({
      data: {
        reporterId,
        targetType: dto.targetType,
        targetId: dto.targetId,
        reason: dto.reason,
        category: dto.category,
        evidenceUrls: dto.evidenceUrls ?? [],
      },
    });
    if (dto.targetType === 'USER') await this.evaluateAutomaticFlag(dto.targetId);
    return report;
  }

  async openDispute(userId: string, dto: OpenDisputeDto) {
    const contract = await this.prisma.contract.findUnique({ where: { id: dto.contractId } });
    if (!contract) throw new NotFoundException('CONTRACT_NOT_FOUND');
    if (contract.clientId !== userId && contract.freelancerId !== userId) {
      throw new ForbiddenException('NOT_CONTRACT_PARTY');
    }
    if (!['ACTIVE', 'PAUSED'].includes(contract.status)) {
      throw new BadRequestException('CONTRACT_CANNOT_BE_DISPUTED');
    }

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 5);
    const dispute = await this.prisma.$transaction(async (tx) => {
      const created = await tx.dispute.create({
        data: {
          contractId: contract.id,
          openedById: userId,
          reason: dto.reason,
          reviewDeadline: deadline,
          ...(dto.evidenceUrls?.length
            ? { evidence: { create: { submittedBy: userId, description: dto.reason, fileUrls: dto.evidenceUrls } } }
            : {}),
        },
        include: { evidence: true },
      });
      await tx.contract.update({
        where: { id: contract.id },
        data: { status: 'DISPUTED', disputeReason: dto.reason },
      });
      await tx.report.create({
        data: {
          reporterId: userId,
          targetType: 'CONTRACT',
          targetId: contract.id,
          category: 'QUALITY_DISPUTE',
          reason: dto.reason,
          evidenceUrls: dto.evidenceUrls ?? [],
        },
      });
      return created;
    });

    await Promise.all([
      this.evaluateAutomaticFlag(contract.clientId),
      this.evaluateAutomaticFlag(contract.freelancerId),
    ]);
    return dispute;
  }

  async submitEvidence(userId: string, disputeId: string, dto: SubmitEvidenceDto) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { contract: true },
    });
    if (!dispute) throw new NotFoundException('DISPUTE_NOT_FOUND');
    if (dispute.contract.clientId !== userId && dispute.contract.freelancerId !== userId) {
      throw new ForbiddenException('NOT_CONTRACT_PARTY');
    }
    if (dispute.status === 'RESOLVED') throw new BadRequestException('DISPUTE_ALREADY_RESOLVED');
    if (new Date() > dispute.reviewDeadline) throw new BadRequestException('EVIDENCE_WINDOW_CLOSED');

    return this.prisma.$transaction(async (tx) => {
      const evidence = await tx.disputeEvidence.create({
        data: { disputeId, submittedBy: userId, description: dto.description, fileUrls: dto.fileUrls },
      });
      const submissions = await tx.disputeEvidence.findMany({
        where: { disputeId },
        distinct: ['submittedBy'],
        select: { submittedBy: true },
      });
      const bothPartiesSubmitted =
        submissions.some((item) => item.submittedBy === dispute.contract.clientId) &&
        submissions.some((item) => item.submittedBy === dispute.contract.freelancerId);
      if (bothPartiesSubmitted) {
        await tx.dispute.update({
          where: { id: disputeId },
          data: { status: 'UNDER_REVIEW' },
        });
      }
      return evidence;
    });
  }

  async getDispute(userId: string, disputeId: string) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { contract: true, evidence: { include: { submitter: { select: { id: true, fullName: true } } } } },
    });
    if (!dispute) throw new NotFoundException('DISPUTE_NOT_FOUND');
    if (dispute.contract.clientId !== userId && dispute.contract.freelancerId !== userId) {
      throw new ForbiddenException('NOT_CONTRACT_PARTY');
    }
    return dispute;
  }

  private async evaluateAutomaticFlag(userId: string) {
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const [reportCount, totalContracts, disputedContracts, totalBids, spamBids] = await Promise.all([
      this.prisma.report.count({ where: { targetType: 'USER', targetId: userId, createdAt: { gte: since } } }),
      this.prisma.contract.count({ where: { OR: [{ clientId: userId }, { freelancerId: userId }] } }),
      this.prisma.contract.count({ where: { OR: [{ clientId: userId }, { freelancerId: userId }], status: 'DISPUTED' } }),
      this.prisma.bid.count({ where: { freelancerId: userId } }),
      this.prisma.bid.count({ where: { freelancerId: userId, isTemplateBid: true } }),
    ]);
    const disputeRate = totalContracts ? disputedContracts / totalContracts : 0;
    const spamRate = totalBids ? spamBids / totalBids : 0;
    const reasons = [
      ...(reportCount >= 3 ? [`${reportCount} reports in 30 days`] : []),
      ...(disputeRate > 0.2 ? [`dispute rate ${Math.round(disputeRate * 100)}%`] : []),
      ...(spamRate > 0.5 ? [`bid spam rate ${Math.round(spamRate * 100)}%`] : []),
    ];
    if (reasons.length) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { autoFlaggedAt: new Date(), autoFlagReason: reasons.join('; ') },
      });
    }
  }
}
