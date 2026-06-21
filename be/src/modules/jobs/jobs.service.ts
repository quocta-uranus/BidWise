import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobStatus } from '@prisma/client';

@Injectable()
export class JobsService {
  constructor(private prisma: PrismaService) {}

  async getCategories() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async create(clientId: string, createJobDto: CreateJobDto) {
    const { ahpWeight } = createJobDto;
    
    // Validate AHP weights sum to 100
    const totalWeight = Object.values(ahpWeight).reduce((sum, weight) => sum + Number(weight), 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      throw new BadRequestException(`AHP weights must sum up to exactly 100. Current sum is ${totalWeight}`);
    }

    if (new Date(createJobDto.deadline) <= new Date()) {
      throw new BadRequestException('Deadline must be in the future');
    }

    try {
      return await this.prisma.job.create({
        data: {
          clientId,
          title: createJobDto.title,
          description: createJobDto.description,
          budgetFormat: createJobDto.budgetFormat,
          minBudget: createJobDto.minBudget,
          maxBudget: createJobDto.maxBudget,
          fixedBudget: createJobDto.fixedBudget,
          deadline: new Date(createJobDto.deadline),
          categoryId: createJobDto.categoryId,
          auctionType: createJobDto.auctionType,
          skills: {
            create: createJobDto.skills.map(name => ({ name })),
          },
          ahpWeight: {
            create: ahpWeight,
          },
          attachments: createJobDto.attachments ? {
            create: createJobDto.attachments,
          } : undefined,
        },
        include: {
          skills: true,
          ahpWeight: true,
          attachments: true,
          category: true,
        }
      });
    } catch (error: any) {
      console.error('Failed to create job:', error);
      throw new BadRequestException('Database Error: ' + error.message);
    }
  }

  async findAll(clientId?: string) {
    const where = clientId ? { clientId, deletedAt: null } : { deletedAt: null };
    return this.prisma.job.findMany({
      where,
      include: {
        category: true,
        skills: true,
        client: true,
        _count: { select: { bids: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const job = await this.prisma.job.findUnique({
      where: { id, deletedAt: null },
      include: {
        skills: true,
        ahpWeight: true,
        attachments: true,
        category: true,
        _count: {
          select: { bids: true }
        }
      }
    });

    if (!job) throw new NotFoundException('Job not found');
    return job;
  }

  async update(id: string, clientId: string, updateJobDto: UpdateJobDto) {
    const job = await this.findOne(id);

    if (job.clientId !== clientId) {
      throw new ForbiddenException('You can only edit your own jobs');
    }

    // Check if job has bids
    if (job._count.bids > 0 && updateJobDto.status === undefined) {
      throw new ForbiddenException('Cannot edit job details because it already has bids');
    }

    const { skills, ahpWeight, attachments, ...rest } = updateJobDto as any;

    return this.prisma.job.update({
      where: { id },
      data: {
        ...rest,
        deadline: rest.deadline ? new Date(rest.deadline) : undefined,
      },
      include: {
        skills: true,
        ahpWeight: true,
        attachments: true,
        category: true,
      }
    });
  }

  async remove(id: string, clientId: string) {
    const job = await this.findOne(id);
    if (job.clientId !== clientId) {
      throw new ForbiddenException('You can only delete your own jobs');
    }

    // Check if it's already in progress or completed
    if (([JobStatus.IN_PROGRESS, JobStatus.COMPLETED] as JobStatus[]).includes(job.status)) {
      throw new ForbiddenException('Cannot delete a job that is in progress or completed');
    }

    return this.prisma.job.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }

  async createBid(freelancerId: string, jobId: string, data: { amount: number; deliveryDays: number; proposal: string }) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId, deletedAt: null },
    });
    if (!job) {
      throw new NotFoundException('Không tìm thấy dự án.');
    }
    if (job.status !== 'OPEN') {
      throw new BadRequestException('Dự án không ở trạng thái mở thầu.');
    }

    // Check if already bid
    const existingBid = await this.prisma.bid.findUnique({
      where: {
        jobId_freelancerId: { jobId, freelancerId },
      },
    });
    if (existingBid) {
      throw new BadRequestException('Bạn đã nộp đề xuất thầu cho dự án này rồi.');
    }

    return this.prisma.bid.create({
      data: {
        jobId,
        freelancerId,
        amount: data.amount,
        deliveryDays: data.deliveryDays,
        proposal: data.proposal,
      },
      include: {
        freelancer: true,
      },
    });
  }

  async getBidsForJob(jobId: string) {
    return this.prisma.bid.findMany({
      where: { jobId },
      include: {
        freelancer: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getFreelancerBids(freelancerId: string) {
    return this.prisma.bid.findMany({
      where: { freelancerId },
      include: {
        job: {
          include: {
            client: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateBid(freelancerId: string, bidId: string, data: { amount: number; deliveryDays: number; proposal: string }) {
    const bid = await this.prisma.bid.findUnique({
      where: { id: bidId },
    });

    if (!bid || bid.freelancerId !== freelancerId) {
      throw new ForbiddenException('Bạn không có quyền cập nhật thầu này.');
    }

    if (bid.status !== 'PENDING') {
      throw new BadRequestException('Không thể cập nhật thầu đã được duyệt hoặc từ chối.');
    }

    return this.prisma.bid.update({
      where: { id: bidId },
      data: {
        amount: data.amount,
        deliveryDays: data.deliveryDays,
        proposal: data.proposal,
      },
    });
  }

  async cancelBid(freelancerId: string, bidId: string) {
    const bid = await this.prisma.bid.findUnique({
      where: { id: bidId },
    });

    if (!bid || bid.freelancerId !== freelancerId) {
      throw new ForbiddenException('Bạn không có quyền hủy thầu này.');
    }

    return this.prisma.bid.update({
      where: { id: bidId },
      data: { status: 'WITHDRAWN' },
    });
  }
}
