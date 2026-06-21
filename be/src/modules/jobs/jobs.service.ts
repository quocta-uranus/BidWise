import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobDto, UpdateJobDto, JobSearchDto, JobSuggestionDto } from './dto/job-search.dto';
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
          budget: createJobDto.fixedBudget ?? createJobDto.minBudget,
          deadline: new Date(createJobDto.deadline),
          categoryId: createJobDto.categoryId,
          auctionType: createJobDto.auctionType,
          skills: createJobDto.skills,
          ahpWeight: {
            create: ahpWeight,
          },
          attachments: createJobDto.attachments ? {
            create: createJobDto.attachments,
          } : undefined,
        },
        include: {
          ahpWeight: true,
          attachments: true,
          category: true,
          _count: { select: { bids: true } },
        }
      });
    } catch (error: any) {
      console.error('Failed to create job:', error);
      throw new BadRequestException('Database Error: ' + error.message);
    }
  }

  async findAll(clientId?: string) {
    console.log('=== findAll called ===');
    console.log('clientId:', clientId);
    const where = clientId ? { clientId, deletedAt: null } : { deletedAt: null };
    console.log('where:', JSON.stringify(where));
    try {
      const result = await this.prisma.job.findMany({
        where,
        include: {
          category: true,
          client: true,
          _count: { select: { bids: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      console.log('findAll result count:', result.length);
      return result;
    } catch (error: any) {
      console.error('=== findAll ERROR ===');
      console.error(error);
      throw error;
    }
  }

  async findOne(id: string) {
    const job = await this.prisma.job.findUnique({
      where: { id, deletedAt: null },
      include: {
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

  async findOneWithClient(id: string) {
    const job = await this.prisma.job.findUnique({
      where: { id, deletedAt: null },
      include: {
        ahpWeight: true,
        attachments: true,
        category: true,
        client: { select: { id: true, fullName: true, avatarUrl: true } },
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

    if (job._count.bids > 0 && updateJobDto.status === undefined) {
      throw new ForbiddenException('Cannot edit job details because it already has bids');
    }

    const { ahpWeight, attachments, ...rest } = updateJobDto as any;

    return this.prisma.job.update({
      where: { id },
      data: {
        ...rest,
        deadline: rest.deadline ? new Date(rest.deadline) : undefined,
        budget: rest.fixedBudget ?? rest.minBudget ?? job.budget,
      },
      include: {
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

  // FL-07: List jobs with pagination and sorting
  async findJobs(searchDto: JobSearchDto) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = searchDto;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
      status: JobStatus.OPEN,
    };

    // FL-08: Keyword search
    if (searchDto.keyword) {
      where.OR = [
        { title: { contains: searchDto.keyword, mode: 'insensitive' } },
        { description: { contains: searchDto.keyword, mode: 'insensitive' } },
      ];
    }

    // FL-08: Category filter
    if (searchDto.categoryId) {
      where.categoryId = searchDto.categoryId;
    }

    // FL-08: Budget range filter
    if (searchDto.minBudget !== undefined || searchDto.maxBudget !== undefined) {
      where.OR = where.OR || [];
      where.OR.push({
        OR: [
          {
            fixedBudget: {
              ...(searchDto.minBudget !== undefined && { gte: searchDto.minBudget }),
              ...(searchDto.maxBudget !== undefined && { lte: searchDto.maxBudget }),
            },
          },
          {
            AND: [
              { budgetFormat: 'RANGE' },
              ...(searchDto.minBudget !== undefined ? [{ minBudget: { gte: searchDto.minBudget } }] : []),
              ...(searchDto.maxBudget !== undefined ? [{ maxBudget: { lte: searchDto.maxBudget } }] : []),
            ],
          },
        ],
      });
    }

    // FL-08: Skills filter
    if (searchDto.skills && searchDto.skills.length > 0) {
      where.skills = { hasSome: searchDto.skills };
    }

    // FL-08: Deadline filter
    if (searchDto.deadlineBefore) {
      where.deadline = { lte: new Date(searchDto.deadlineBefore) };
    }

    // FL-08: Auction type filter
    if (searchDto.auctionType) {
      where.auctionType = searchDto.auctionType;
    }

    const orderBy: any = {};
    if (sortBy === 'budget') {
      orderBy.fixedBudget = sortOrder;
      orderBy.minBudget = sortOrder;
    } else if (sortBy === 'deadline') {
      orderBy.deadline = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    const [jobs, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        include: {
          category: true,
          client: { select: { id: true, fullName: true, avatarUrl: true } },
          _count: { select: { bids: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.job.count({ where }),
    ]);

    return {
      jobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // FL-09: Job suggestions based on freelancer profile (TF-IDF + cosine similarity)
  async suggestJobs(freelancerId: string, suggestionDto: JobSuggestionDto) {
    const { limit = 10 } = suggestionDto;

    // Get freelancer profile
    const profile = await this.prisma.freelancerProfile.findUnique({
      where: { userId: freelancerId },
    });

    if (!profile || !profile.skills || profile.skills.length === 0) {
      // Cold-start: return newest jobs
      return this.prisma.job.findMany({
        where: { deletedAt: null, status: JobStatus.OPEN },
        include: {
          category: true,
          client: { select: { id: true, fullName: true, avatarUrl: true } },
          _count: { select: { bids: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    }

    const freelancerSkills = profile.skills.map(s => s.toLowerCase());

    // Get all open jobs
    const jobs = await this.prisma.job.findMany({
      where: { deletedAt: null, status: JobStatus.OPEN },
      include: {
        category: true,
        client: { select: { id: true, fullName: true, avatarUrl: true } },
        _count: { select: { bids: true } },
      },
    });

    // Calculate TF-IDF scores and cosine similarity
    const scoredJobs = jobs.map(job => {
      const jobSkills = (job.skills || []).map(s => s.toLowerCase());
      
      // TF-IDF for job skills
      const jobTfIdf = this.calculateTfIdf(jobSkills, [freelancerSkills]);
      
      // TF-IDF for freelancer skills
      const freelancerTfIdf = this.calculateTfIdf(freelancerSkills, [jobSkills]);
      
      // Cosine similarity
      const similarity = this.cosineSimilarity(jobTfIdf, freelancerTfIdf);
      
      // Bonus for skill overlap
      const skillOverlap = jobSkills.filter(s => freelancerSkills.includes(s)).length;
      const skillBonus = freelancerSkills.length > 0 
        ? (skillOverlap / freelancerSkills.length) * 0.3 
        : 0;
      
      // Bonus for completed assessment
      const assessmentBonus = profile.assessmentCompleted ? 0.1 : 0;

      return {
        ...job,
        matchScore: Math.min(1, similarity + skillBonus + assessmentBonus),
        skillMatch: skillOverlap,
        matchedSkills: jobSkills.filter(s => freelancerSkills.includes(s)),
      };
    });

    // Sort by match score
    scoredJobs.sort((a, b) => b.matchScore - a.matchScore);

    return scoredJobs.slice(0, limit);
  }

  private calculateTfIdf(skills: string[], allSkillSets: string[][]): Record<string, number> {
    const tf: Record<string, number> = {};
    
    // Term Frequency
    skills.forEach(skill => {
      tf[skill] = (tf[skill] || 0) + 1;
    });
    
    // Normalize by max frequency
    const maxFreq = Math.max(...Object.values(tf), 1);
    Object.keys(tf).forEach(key => {
      tf[key] = tf[key] / maxFreq;
    });

    // IDF (simplified)
    const idf: Record<string, number> = {};
    const allSkills = new Set(allSkillSets.flat());
    
    allSkills.forEach(skill => {
      const docsWithSkill = allSkillSets.filter(skills => skills.includes(skill)).length;
      idf[skill] = Math.log((allSkillSets.length + 1) / (docsWithSkill + 1)) + 1;
    });

    // TF-IDF
    const tfIdf: Record<string, number> = {};
    Object.keys(tf).forEach(skill => {
      tfIdf[skill] = tf[skill] * (idf[skill] || 1);
    });

    return tfIdf;
  }

  private cosineSimilarity(vec1: Record<string, number>, vec2: Record<string, number>): number {
    const allKeys = new Set([...Object.keys(vec1), ...Object.keys(vec2)]);
    
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    allKeys.forEach(key => {
      const v1 = vec1[key] || 0;
      const v2 = vec2[key] || 0;
      dotProduct += v1 * v2;
      norm1 += v1 * v1;
      norm2 += v2 * v2;
    });

    const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  // FL-10: Bookmarks
  async addBookmark(userId: string, jobId: string) {
    const job = await this.findOne(jobId);
    
    // Check if already bookmarked
    const existing = await this.prisma.jobBookmark.findUnique({
      where: { userId_jobId: { userId, jobId } },
    });
    
    if (existing) {
      return { bookmarked: true, message: 'Job already bookmarked' };
    }

    await this.prisma.jobBookmark.create({
      data: { userId, jobId },
    });

    return { bookmarked: true, jobId };
  }

  async removeBookmark(userId: string, jobId: string) {
    await this.prisma.jobBookmark.deleteMany({
      where: { userId, jobId },
    });

    return { bookmarked: false, jobId };
  }

  async getBookmarks(userId: string) {
    const bookmarks = await this.prisma.jobBookmark.findMany({
      where: { userId },
      include: {
        job: {
          include: {
            category: true,
            client: { select: { id: true, fullName: true, avatarUrl: true } },
            _count: { select: { bids: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return bookmarks.map(b => b.job);
  }

  async isBookmarked(userId: string, jobId: string) {
    const bookmark = await this.prisma.jobBookmark.findUnique({
      where: { userId_jobId: { userId, jobId } },
    });
    return { isBookmarked: !!bookmark };
  }

  // FL-11: Job alerts
  async getJobAlert(userId: string) {
    let alert = await this.prisma.jobAlert.findUnique({
      where: { userId },
    });

    if (!alert) {
      alert = await this.prisma.jobAlert.create({
        data: { userId, enabled: true, frequency: 'daily' },
      });
    }

    return alert;
  }

  async updateJobAlert(userId: string, enabled: boolean, frequency: string = 'daily') {
    const alert = await this.prisma.jobAlert.upsert({
      where: { userId },
      update: { enabled, frequency },
      create: { userId, enabled, frequency },
    });

    return alert;
  }

  async toggleJobAlert(userId: string) {
    const alert = await this.getJobAlert(userId);
    
    return this.prisma.jobAlert.update({
      where: { userId },
      data: { enabled: !alert.enabled },
    });
  }
}
