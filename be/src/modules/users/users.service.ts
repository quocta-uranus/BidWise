import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SessionService } from '../session/session.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private sessionService: SessionService,
  ) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: { include: { role: true } },
        reviewsReceived: {
          include: { reviewer: { select: { fullName: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
      omit: { passwordHash: true },
    });
    if (!user) throw new NotFoundException('USER_NOT_FOUND');
    return {
      ...user,
      roles: user.userRoles.map((ur) => ur.role.name),
      reviews: user.reviewsReceived.map((r) => ({
        id: r.id,
        reviewerName: r.anonymous ? 'Ẩn danh' : r.reviewer.fullName,
        rating: (r.qualityRating + r.commRating + r.speedRating) / 3,
        comment: r.comment,
        date: r.createdAt.toISOString().split('T')[0],
      })),
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      omit: { passwordHash: true },
    });
  }

  async getSessions(userId: string, currentSessionId: string) {
    const sessions = await this.sessionService.findActiveByUser(userId);
    return sessions.map((s) => ({
      ...s,
      isCurrent: s.id === currentSessionId,
    }));
  }

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    const session = await this.prisma.loginSession.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) throw new NotFoundException('SESSION_NOT_FOUND');
    await this.sessionService.revoke(sessionId);
  }
}
