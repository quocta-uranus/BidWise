import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto';
import { UploadCvDto } from './dto/upload-cv.dto';
import { AddCertificateDto } from './dto/add-certificate.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';

@Injectable()
export class FreelancerProfileService {
  constructor(private readonly prisma: PrismaService) {}

  // FL-01: Create freelancer profile
  async createProfile(userId: string, dto: CreateProfileDto) {
    const existing = await this.prisma.freelancerProfile.findUnique({
      where: { userId },
    });
    if (existing) {
      throw new ForbiddenException('PROFILE_ALREADY_EXISTS');
    }

    return this.prisma.freelancerProfile.create({
      data: {
        userId,
        ...dto,
      },
    });
  }

  // FL-01: Get my profile (merged with User bio/phone)
  async getMyProfile(userId: string) {
    const [profile, user] = await Promise.all([
      this.prisma.freelancerProfile.findUnique({
        where: { userId },
        include: {
          portfolios: { orderBy: { createdAt: 'desc' } },
          certifications: { orderBy: { createdAt: 'desc' } },
        },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { bio: true, phone: true },
      }),
    ]);
    if (!profile) {
      throw new NotFoundException('FREELANCER_PROFILE_NOT_FOUND');
    }
    return {
      ...profile,
      bio: user?.bio ?? null,
      phone: user?.phone ?? null,
    };
  }

  // FL-01: Update profile (bio/phone via User table, rest via FreelancerProfile)
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const profile = await this.prisma.freelancerProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new NotFoundException('FREELANCER_PROFILE_NOT_FOUND');
    }

    const { bio, phone, ...profileDto } = dto;

    const updates: any[] = [];
    if (Object.keys(profileDto).length > 0) {
      updates.push(
        this.prisma.freelancerProfile.update({
          where: { userId },
          data: profileDto,
        }),
      );
    }
    if (bio !== undefined || phone !== undefined) {
      updates.push(
        this.prisma.user.update({
          where: { id: userId },
          data: { bio, phone },
          select: { bio: true, phone: true },
        }),
      );
    }

    if (updates.length === 0) return this.getMyProfile(userId);
    await this.prisma.$transaction(updates);
    return this.getMyProfile(userId);
  }

  // FL-02: Create portfolio item
  async createPortfolio(userId: string, dto: CreatePortfolioDto) {
    const profile = await this.ensureProfileExists(userId);
    return this.prisma.portfolio.create({
      data: {
        ...dto,
        freelancerProfileId: profile.id,
      },
    });
  }

  // FL-02: Get portfolio items
  async getPortfolios(userId: string) {
    const profile = await this.prisma.freelancerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('FREELANCER_PROFILE_NOT_FOUND');
    return this.prisma.portfolio.findMany({
      where: { freelancerProfileId: profile.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  // FL-02: Update portfolio item
  async updatePortfolio(userId: string, portfolioId: string, dto: UpdatePortfolioDto) {
    const profile = await this.ensureProfileExists(userId);
    const portfolio = await this.prisma.portfolio.findFirst({
      where: { id: portfolioId, freelancerProfileId: profile.id },
    });
    if (!portfolio) throw new NotFoundException('PORTFOLIO_NOT_FOUND');
    return this.prisma.portfolio.update({ where: { id: portfolioId }, data: dto });
  }

  // FL-02: Delete portfolio item
  async deletePortfolio(userId: string, portfolioId: string) {
    const profile = await this.ensureProfileExists(userId);
    const portfolio = await this.prisma.portfolio.findFirst({
      where: { id: portfolioId, freelancerProfileId: profile.id },
    });
    if (!portfolio) throw new NotFoundException('PORTFOLIO_NOT_FOUND');
    await this.prisma.portfolio.delete({ where: { id: portfolioId } });
    return { message: 'Portfolio deleted successfully' };
  }

  // FL-03: Upload CV
  async uploadCv(userId: string, dto: UploadCvDto) {
    await this.ensureProfileExists(userId);
    return this.prisma.freelancerProfile.update({
      where: { userId },
      data: {
        cvFileUrl: dto.fileUrl,
        cvFileName: dto.fileName,
        cvFileSize: dto.fileSize,
        cvUploadedAt: new Date(),
      },
    });
  }

  // FL-03: Get CV info
  async getCv(userId: string) {
    const profile = await this.prisma.freelancerProfile.findUnique({
      where: { userId },
      select: { cvFileUrl: true, cvFileName: true, cvFileSize: true, cvUploadedAt: true },
    });
    if (!profile || !profile.cvFileUrl) throw new NotFoundException('CV_NOT_FOUND');
    return {
      fileName: profile.cvFileName,
      fileSize: profile.cvFileSize,
      uploadedAt: profile.cvUploadedAt?.toISOString() ?? null,
    };
  }

  // FL-03: Delete CV
  async deleteCv(userId: string) {
    await this.ensureProfileExists(userId);
    return this.prisma.freelancerProfile.update({
      where: { userId },
      data: {
        cvFileUrl: null,
        cvFileName: null,
        cvFileSize: null,
        cvUploadedAt: null,
      },
    });
  }

  // FL-04: Add certification
  async addCertification(userId: string, dto: AddCertificateDto) {
    const profile = await this.ensureProfileExists(userId);
    return this.prisma.certification.create({
      data: { ...dto, freelancerProfileId: profile.id },
    });
  }

  // FL-04: Get certifications
  async getCertifications(userId: string) {
    const profile = await this.prisma.freelancerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('FREELANCER_PROFILE_NOT_FOUND');
    return this.prisma.certification.findMany({
      where: { freelancerProfileId: profile.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  // FL-04: Delete certification
  async deleteCertification(userId: string, certificationId: string) {
    const profile = await this.ensureProfileExists(userId);
    const cert = await this.prisma.certification.findFirst({
      where: { id: certificationId, freelancerProfileId: profile.id },
    });
    if (!cert) throw new NotFoundException('CERTIFICATION_NOT_FOUND');
    await this.prisma.certification.delete({ where: { id: certificationId } });
    return { message: 'Certification deleted successfully' };
  }

  // FL-05: Add skill
  async addSkill(userId: string, skill: string) {
    const profile = await this.ensureProfileExists(userId);
    const trimmed = skill.trim();
    if (!trimmed) throw new BadRequestException('Skill name cannot be empty');

    const current = profile.skills ?? [];
    if (current.includes(trimmed)) return profile;

    return this.prisma.freelancerProfile.update({
      where: { userId },
      data: { skills: { push: trimmed } },
    });
  }

  // FL-05: Remove skill
  async removeSkill(userId: string, skill: string) {
    const profile = await this.ensureProfileExists(userId);
    const current = profile.skills ?? [];
    if (!current.includes(skill)) return profile;

    return this.prisma.freelancerProfile.update({
      where: { userId },
      data: { skills: current.filter((s) => s !== skill) },
    });
  }

  // FL-05: Submit skill assessment
  async submitAssessment(userId: string, answers: number[]) {
    const profile = await this.ensureProfileExists(userId);

    // Simple scoring: count correct answers (demo assumes answers[i] === correct index)
    const score = answers.length;
    let level = 'Beginner';
    if (score >= 4) level = 'Expert';
    else if (score >= 2) level = 'Intermediate';

    return this.prisma.freelancerProfile.update({
      where: { userId },
      data: {
        assessmentCompleted: true,
        assessmentScore: score,
        assessmentLevel: level,
        assessmentCompletedAt: new Date(),
      },
    });
  }

  // FL-06: Update availability
  async updateAvailability(userId: string, dto: UpdateAvailabilityDto) {
    await this.ensureProfileExists(userId);
    return this.prisma.freelancerProfile.update({
      where: { userId },
      data: { available: dto.isAvailable },
    });
  }

  private async ensureProfileExists(userId: string) {
    const profile = await this.prisma.freelancerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('FREELANCER_PROFILE_NOT_FOUND');
    return profile;
  }
}
