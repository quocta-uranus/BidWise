import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto } from '../../common/dto/job-browse.dto';

@Injectable()
export class SavedJobsService {
  constructor(private prisma: PrismaService) {}

  // FL-10: bookmark a job
  async saveJob(userId: string, jobId: string) {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, deletedAt: null },
    });
    if (!job) throw new NotFoundException('JOB_NOT_FOUND');

    const saved = await this.prisma.jobBookmark.upsert({
      where: { userId_jobId: { userId, jobId } },
      create: { userId, jobId },
      update: {},
      include: { job: true },
    });
    return saved;
  }

  async unsaveJob(userId: string, jobId: string) {
    const existing = await this.prisma.jobBookmark.findUnique({
      where: { userId_jobId: { userId, jobId } },
    });
    if (!existing) throw new NotFoundException('SAVED_JOB_NOT_FOUND');
    await this.prisma.jobBookmark.delete({ where: { id: existing.id } });
    return { message: 'Removed from saved jobs' };
  }

  async listSavedJobs(userId: string, pagination: PaginationDto) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.jobBookmark.findMany({
        where: { userId },
        include: {
          job: {
            include: {
              _count: { select: { bids: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.jobBookmark.count({ where: { userId } }),
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

  async isSaved(userId: string, jobId: string) {
    const found = await this.prisma.jobBookmark.findUnique({
      where: { userId_jobId: { userId, jobId } },
    });
    return { saved: !!found };
  }
}
