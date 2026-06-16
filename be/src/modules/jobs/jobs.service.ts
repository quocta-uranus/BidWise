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
      include: { category: true, _count: { select: { bids: true } } },
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
}
