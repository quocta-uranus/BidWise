import { Injectable } from '@nestjs/common';
import { UAParser } from 'ua-parser-js';
import { PrismaService } from '../prisma/prisma.service';
import { LoginSession } from '@prisma/client';

@Injectable()
export class SessionService {
  constructor(private prisma: PrismaService) {}

  async create(params: {
    userId: string;
    ipAddress: string;
    userAgent?: string;
  }): Promise<LoginSession> {
    const device = this.parseDevice(params.userAgent);

    return this.prisma.loginSession.create({
      data: {
        userId: params.userId,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        deviceType: device.type,
        deviceName: device.name,
        status: 'ACTIVE',
        lastActiveAt: new Date(),
      },
    });
  }

  async findActiveByUser(userId: string) {
    return this.prisma.loginSession.findMany({
      where: { userId, status: 'ACTIVE' },
      orderBy: { lastActiveAt: 'desc' },
    });
  }

  async revoke(sessionId: string): Promise<void> {
    await this.prisma.loginSession.update({
      where: { id: sessionId },
      data: { status: 'LOGGED_OUT', loggedOutAt: new Date() },
    });
    await this.prisma.refreshToken.updateMany({
      where: { sessionId, isRevoked: false },
      data: { isRevoked: true, revokedAt: new Date() },
    });
  }

  async touch(sessionId: string): Promise<void> {
    await this.prisma.loginSession.update({
      where: { id: sessionId },
      data: { lastActiveAt: new Date() },
    });
  }

  private parseDevice(userAgent?: string): { type: string; name: string } {
    if (!userAgent) return { type: 'unknown', name: 'Unknown Device' };
    const parser = new UAParser(userAgent);
    const result = parser.getResult();
    const type = result.device.type ?? 'desktop';
    const browser = result.browser.name ?? 'Browser';
    const os = result.os.name ?? 'OS';
    return { type, name: `${browser} on ${os}` };
  }
}
