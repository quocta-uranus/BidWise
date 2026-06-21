import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobBrowseDto, PaginatedResponse } from '../../common/dto/job-browse.dto';

@Injectable()
export class JobsService {
  constructor(private prisma: PrismaService) {}

  async create(clientId: string, createJobDto: CreateJobDto) {
    if (new Date(createJobDto.deadline) <= new Date()) {
      throw new BadRequestException('Deadline must be in the future');
    }

    try {
      return await this.prisma.job.create({
        data: {
          clientId,
          title: createJobDto.title,
          description: createJobDto.description,
          budget: createJobDto.fixedBudget ?? createJobDto.minBudget ?? 0,
          deadline: new Date(createJobDto.deadline),
          category: createJobDto.categoryId,
          auctionType: createJobDto.auctionType,
          status: 'OPEN',
          skills: createJobDto.skills,
        },
      });
    } catch (error: any) {
      throw new BadRequestException('Database Error: ' + error.message);
    }
  }

  async findAll(clientId?: string) {
    const where = clientId ? { clientId, deletedAt: null } : { deletedAt: null };
    return this.prisma.job.findMany({
      where,
      include: { _count: { select: { bids: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // FL-07 + FL-08: Browse jobs with sort, filter, search, pagination
  async browse(query: JobBrowseDto): Promise<PaginatedResponse<any>> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'NEWEST',
      category,
      minBudget,
      maxBudget,
      skill,
      auctionType,
      keyword,
      deadlineWithinDays,
    } = query;

    const where: any = {
      status: 'OPEN',
      deletedAt: null,
    };

    if (category) where.category = category;
    if (auctionType) where.auctionType = auctionType;

    if (minBudget !== undefined || maxBudget !== undefined) {
      where.budget = {};
      if (minBudget !== undefined) where.budget.gte = minBudget;
      if (maxBudget !== undefined) where.budget.lte = maxBudget;
    }

    if (skill) {
      where.skills = { hasSome: [skill] };
    }

    if (deadlineWithinDays && deadlineWithinDays > 0) {
      const until = new Date();
      until.setDate(until.getDate() + deadlineWithinDays);
      where.deadline = { lte: until, gte: new Date() };
    }

    if (keyword && keyword.trim()) {
      const kw = keyword.trim();
      where.OR = [
        { title: { contains: kw, mode: 'insensitive' } },
        { description: { contains: kw, mode: 'insensitive' } },
        { skills: { hasSome: [kw] } },
      ];
    }

    const orderBy = this.buildOrderBy(sortBy);

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          _count: { select: { bids: true } },
        },
      }),
      this.prisma.job.count({ where }),
    ]);

    return {
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  private buildOrderBy(sortBy: string): any {
    switch (sortBy) {
      case 'BUDGET_HIGH':
        return [{ budget: 'desc' }];
      case 'BUDGET_LOW':
        return [{ budget: 'asc' }];
      case 'DEADLINE_SOON':
        return [{ deadline: 'asc' }];
      case 'BIDS_COUNT':
        return [{ bids: { _count: 'desc' } }];
      case 'NEWEST':
      default:
        return [{ createdAt: 'desc' }];
    }
  }

  async findOne(id: string) {
    const job = await this.prisma.job.findUnique({
      where: { id, deletedAt: null },
      include: {
        client: { select: { id: true, fullName: true, avatarUrl: true } },
        _count: { select: { bids: true } },
      },
    });

    if (!job) throw new NotFoundException('Job not found');
    return job;
  }

  async update(id: string, clientId: string, updateJobDto: UpdateJobDto) {
    const job = await this.findOne(id);

    if (job.clientId !== clientId) {
      throw new ForbiddenException('You can only edit your own jobs');
    }

    // Check if we're trying to update status or other fields
    const isStatusUpdate = updateJobDto.status !== undefined;
    if (job._count.bids > 0 && !isStatusUpdate) {
      throw new ForbiddenException('Cannot edit job details because it already has bids');
    }

    return this.prisma.job.update({
      where: { id },
      data: {
        ...updateJobDto,
        deadline: updateJobDto.deadline ? new Date(updateJobDto.deadline) : undefined,
      },
    });
  }

  async remove(id: string, clientId: string) {
    const job = await this.findOne(id);
    if (job.clientId !== clientId) {
      throw new ForbiddenException('You can only delete your own jobs');
    }

    const nonDeletableStatuses = ['IN_PROGRESS', 'COMPLETED'];
    if (nonDeletableStatuses.includes(job.status)) {
      throw new ForbiddenException('Cannot delete a job that is in progress or completed');
    }

    return this.prisma.job.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
