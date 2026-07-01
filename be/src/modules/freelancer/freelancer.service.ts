import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProfileCompletenessService } from './services/profile-completeness.service';
import { FileStorageService } from './services/file-storage.service';
import {
  ASSESSMENT_QUESTIONS,
  gradeAssessment,
} from './constants/assessment-questions';
import {
  CreateCertificateDto,
  CreatePortfolioDto,
  SubmitAssessmentDto,
  UpdateFreelancerProfileDto,
} from './dto/freelancer.dto';
import type { Response } from 'express';
import type { UploadedFilePayload } from './types/upload.types';

@Injectable()
export class FreelancerService {
  constructor(
    private prisma: PrismaService,
    private completenessService: ProfileCompletenessService,
    private fileStorage: FileStorageService,
  ) {}

  private async getProfileRecord(userId: string) {
    let profile = await this.prisma.freelancerProfile.findUnique({
      where: { userId },
      include: {
        portfolioItems: { orderBy: { createdAt: 'desc' } },
        certificates: { orderBy: { createdAt: 'desc' } },
        user: { select: { bio: true, phone: true, fullName: true, email: true } },
      },
    });

    if (!profile) {
      await this.prisma.freelancerProfile.create({ data: { userId } });
      profile = await this.prisma.freelancerProfile.findUnique({
        where: { userId },
        include: {
          portfolioItems: { orderBy: { createdAt: 'desc' } },
          certificates: { orderBy: { createdAt: 'desc' } },
          user: { select: { bio: true, phone: true, fullName: true, email: true } },
        },
      });
    }

    return profile;
  }

  private formatProfile(profile: NonNullable<Awaited<ReturnType<typeof this.getProfileRecord>>>) {
    const completeness = this.completenessService.calculate({
      user: profile.user,
      hourlyRate: profile.hourlyRate ?? 0,
      portfolioCount: profile.portfolioItems.length,
      hasCv: !!profile.cvFileName,
      certificateCount: profile.certificates.length,
      assessmentCompleted: profile.assessmentCompleted,
    });

    return {
      bio: profile.user.bio ?? '',
      phone: profile.user.phone ?? '',
      hourlyRate: profile.hourlyRate ?? 0,
      experience: profile.experience ?? '',
      skills: profile.skills,
      available: profile.available,
      assessmentCompleted: profile.assessmentCompleted,
      assessmentScore: profile.assessmentScore,
      assessmentLevel: profile.assessmentLevel,
      assessmentCompletedAt: profile.assessmentCompletedAt?.toISOString() ?? null,
      cv: profile.cvFileName
        ? {
            fileName: profile.cvFileName,
            fileSize: profile.cvFileSize ?? '',
            fileUrl: profile.cvFileUrl,
            uploadedAt: profile.cvUploadedAt?.toISOString().split('T')[0] ?? '',
          }
        : null,
      portfolio: profile.portfolioItems.map((item: any) => ({
        id: item.id,
        title: item.title,
        desc: item.desc,
        link: item.link,
        linkType: item.linkType,
        fileName: item.fileName,
        fileSize: item.fileSize,
        fileUrl: item.fileUrl,
        createdAt: item.createdAt.toISOString(),
      })),
      certificates: profile.certificates.map((cert: any) => ({
        id: cert.id,
        name: cert.name,
        issuer: cert.issuer,
        date: cert.date,
        verifyLink: cert.verifyLink,
        imageUrl: cert.imageUrl,
        imageFileName: cert.imageFileName,
        verified: cert.verified,
        createdAt: cert.createdAt.toISOString(),
      })),
      completeness,
    };
  }

  async getProfile(userId: string) {
    const profile = await this.getProfileRecord(userId);
    if (!profile) throw new NotFoundException('FREELANCER_PROFILE_NOT_FOUND');
    const formatted = this.formatProfile(profile);
    const reputationMatrix = await this.calculateSkillReputation(userId, profile.skills);
    return {
      ...formatted,
      reputationMatrix,
    };
  }

  async updateProfile(userId: string, dto: UpdateFreelancerProfileDto) {
    const { bio, phone, hourlyRate, experience, skills } = dto;

    if (bio !== undefined || phone !== undefined) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(bio !== undefined && { bio }),
          ...(phone !== undefined && { phone }),
        },
      });
    }

    await this.getProfileRecord(userId);
    await this.prisma.freelancerProfile.update({
      where: { userId },
      data: {
        ...(hourlyRate !== undefined && { hourlyRate }),
        ...(experience !== undefined && { experience }),
        ...(skills !== undefined && { skills }),
      },
    });

    return this.getProfile(userId);
  }

  async setAvailable(userId: string, available: boolean) {
    await this.getProfileRecord(userId);
    await this.prisma.freelancerProfile.update({
      where: { userId },
      data: { available },
    });
    return this.getProfile(userId);
  }

  async addPortfolio(userId: string, dto: CreatePortfolioDto, file?: UploadedFilePayload) {
    const profile = await this.getProfileRecord(userId);
    if (!profile) throw new NotFoundException('FREELANCER_PROFILE_NOT_FOUND');
    if (!file && !dto.link?.trim()) {
      throw new BadRequestException('PORTFOLIO_LINK_OR_FILE_REQUIRED');
    }

    let fileMeta = null;
    if (file) {
      fileMeta = this.fileStorage.savePortfolioFile(userId, file);
    }

    await this.prisma.portfolioItem.create({
      data: {
        freelancerProfileId: profile.id,
        title: dto.title,
        desc: dto.desc ?? '',
        link: dto.link ?? '',
        linkType: dto.linkType ?? (dto.link ? 'other' : null),
        fileName: fileMeta?.fileName,
        fileUrl: fileMeta?.fileUrl,
        fileSize: (fileMeta?.fileSize ?? 0) as number,
        mimeType: fileMeta?.mimeType,
      },
    });

    return this.getProfile(userId);
  }

  async deletePortfolio(userId: string, itemId: string) {
    const profile = await this.getProfileRecord(userId);
    if (!profile) throw new NotFoundException('FREELANCER_PROFILE_NOT_FOUND');
    const item = await this.prisma.portfolioItem.findFirst({
      where: { id: itemId, freelancerProfileId: profile.id },
    });
    if (!item) throw new NotFoundException('PORTFOLIO_NOT_FOUND');

    this.fileStorage.deleteByUrl(userId, item.fileUrl);
    await this.prisma.portfolioItem.delete({ where: { id: itemId } });
    return this.getProfile(userId);
  }

  async uploadCv(userId: string, file: UploadedFilePayload) {
    const profile = await this.getProfileRecord(userId);
    if (!profile) throw new NotFoundException('FREELANCER_PROFILE_NOT_FOUND');
    this.fileStorage.deleteByUrl(userId, profile.cvFileUrl);

    const meta = this.fileStorage.saveCvFile(userId, file);
    await this.prisma.freelancerProfile.update({
      where: { userId },
      data: {
        cvFileName: meta.fileName,
        cvFileUrl: meta.fileUrl,
        cvFileSize: Number(meta.fileSize ?? 0),
        cvUploadedAt: new Date(),
      },
    });

    return this.getProfile(userId);
  }

  async deleteCv(userId: string) {
    const profile = await this.getProfileRecord(userId);
    if (!profile) throw new NotFoundException('FREELANCER_PROFILE_NOT_FOUND');
    this.fileStorage.deleteByUrl(userId, profile.cvFileUrl);
    await this.prisma.freelancerProfile.update({
      where: { userId },
      data: {
        cvFileName: null,
        cvFileUrl: null,
        cvFileSize: null,
        cvUploadedAt: null,
      },
    });
    return this.getProfile(userId);
  }

  async addCertificate(
    userId: string,
    dto: CreateCertificateDto,
    image?: UploadedFilePayload,
  ) {
    const profile = await this.getProfileRecord(userId);
    if (!profile) throw new NotFoundException('FREELANCER_PROFILE_NOT_FOUND');
    let imageMeta = null;
    if (image) {
      imageMeta = this.fileStorage.saveCertificateImage(userId, image);
    }

    await this.prisma.certificate.create({
      data: {
        freelancerProfileId: profile.id,
        name: dto.name,
        issuer: dto.issuer,
        date: dto.date ?? null,
        verifyLink: dto.verifyLink,
      },
    });

    return this.getProfile(userId);
  }

  async deleteCertificate(userId: string, certId: string) {
    const profile = await this.getProfileRecord(userId);
    if (!profile) throw new NotFoundException('FREELANCER_PROFILE_NOT_FOUND');
    const cert = await this.prisma.certificate.findFirst({
      where: { id: certId, freelancerProfileId: profile.id },
    });
    if (!cert) throw new NotFoundException('CERTIFICATE_NOT_FOUND');

    this.fileStorage.deleteByUrl(userId, cert.verifyLink ?? '');
    await this.prisma.certificate.delete({ where: { id: certId } });
    return this.getProfile(userId);
  }

  getAssessmentQuestions() {
    return {
      title: 'JavaScript & React Skill Assessment',
      totalQuestions: ASSESSMENT_QUESTIONS.length,
      questions: ASSESSMENT_QUESTIONS.map(({ id, question, options, type }) => ({
        id,
        question,
        options,
        type,
      })),
    };
  }

  async submitAssessment(userId: string, dto: SubmitAssessmentDto) {
    if (dto.answers.length !== ASSESSMENT_QUESTIONS.length) {
      throw new BadRequestException('ASSESSMENT_INCOMPLETE');
    }

    const answerMap: Record<string, number> = {};
    for (const answer of dto.answers) {
      const question = ASSESSMENT_QUESTIONS.find((q) => q.id === answer.questionId);
      if (!question) throw new BadRequestException('INVALID_QUESTION_ID');
      if (answer.selectedIndex >= question.options.length) {
        throw new BadRequestException('INVALID_ANSWER_INDEX');
      }
      answerMap[answer.questionId] = answer.selectedIndex;
    }

    const result = gradeAssessment(answerMap);
    await this.getProfileRecord(userId);
    await this.prisma.freelancerProfile.update({
      where: { userId },
      data: {
        assessmentCompleted: true,
        assessmentScore: result.score,
        assessmentLevel: result.level,
        assessmentCompletedAt: new Date(),
      },
    });

    return {
      ...result,
      message: 'Assessment completed successfully',
      profile: await this.getProfile(userId),
    };
  }

  async getAssessmentResult(userId: string) {
    const profile = await this.getProfileRecord(userId);
    if (!profile || !profile.assessmentCompleted) {
      return { completed: false, score: null, level: null };
    }
    return {
      completed: true,
      score: profile.assessmentScore,
      maxScore: ASSESSMENT_QUESTIONS.length,
      level: profile.assessmentLevel,
      completedAt: profile.assessmentCompletedAt?.toISOString() ?? null,
    };
  }

  serveFile(userId: string, category: string, filename: string, res: Response) {
    const allowed = ['portfolio', 'cv', 'certificates'];
    if (!allowed.includes(category)) throw new ForbiddenException('INVALID_FILE_CATEGORY');
    const path = this.fileStorage.resolvePath(userId, category, filename);
    this.fileStorage.streamFile(path, res, category === 'cv' ? filename : undefined);
  }

  async calculateSkillReputation(userId: string, profileSkills: string[]) {
    const reviews = await this.prisma.review.findMany({
      where: { revieweeId: userId },
      include: {
        contract: {
          include: {
            job: {
              include: {
                jobSkills: true,
              },
            },
          },
        },
      },
    });

    const skillStats: Record<string, { sum: number; count: number }> = {};

    for (const review of reviews) {
      const skills = review.contract.job.jobSkills.map(s => s.name);
      const rating = (review.qualityRating + review.commRating + review.speedRating) / 3;
      for (const skill of skills) {
        const normalizedSkill = skill.trim();
        if (!skillStats[normalizedSkill]) {
          skillStats[normalizedSkill] = { sum: 0, count: 0 };
        }
        skillStats[normalizedSkill].sum += rating;
        skillStats[normalizedSkill].count += 1;
      }
    }

    const benchmarks: Record<string, number> = {
      'React': 72,
      'Next.js': 72,
      'React / Next.js': 72,
      'TypeScript': 65,
      'NestJS': 62,
      'NestJS / API Backend': 62,
      'Node.js': 62,
      'Docker': 60,
      'PostgreSQL': 60,
      'Docker / PostgreSQL': 60,
      'React Native': 55,
      'React Native / Mobile': 55,
      'Tailwind CSS': 70,
      'CSS': 60,
    };

    const displaySkills = profileSkills.length > 0 ? profileSkills : ['React / Next.js', 'TypeScript', 'NestJS / API Backend'];
    
    return displaySkills.map(skill => {
      const normalizedSkill = skill.trim();
      let scoreSum = 0;
      let reviewCount = 0;

      for (const statSkill of Object.keys(skillStats)) {
        if (statSkill.toLowerCase() === normalizedSkill.toLowerCase() || 
            normalizedSkill.toLowerCase().includes(statSkill.toLowerCase()) ||
            statSkill.toLowerCase().includes(normalizedSkill.toLowerCase())) {
          scoreSum += skillStats[statSkill].sum;
          reviewCount += skillStats[statSkill].count;
        }
      }

      const score = reviewCount > 0 ? Math.round((scoreSum / reviewCount) * 20) : 0;
      
      let benchmark = 60;
      for (const key of Object.keys(benchmarks)) {
        if (normalizedSkill.toLowerCase().includes(key.toLowerCase())) {
          benchmark = benchmarks[key];
          break;
        }
      }

      return {
        skill,
        score,
        benchmark,
        reviewsCount: reviewCount,
      };
    });
  }
}
