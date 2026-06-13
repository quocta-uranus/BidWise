import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import { RoleType } from '@prisma/client';
import {
  AccessTokenPayload,
  RefreshTokenPayload,
} from '../../common/types/jwt-payload.type';

const BLACKLIST_PREFIX = 'blacklist:at:';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
    @InjectRedis() private redis: Redis,
  ) {}

  // ─── ACCESS TOKEN ────────────────────────────────────────────────────────

  generateAccessToken(payload: {
    userId: string;
    email: string;
    roles: RoleType[];
    sessionId: string;
  }): string {
    const jti = randomBytes(16).toString('hex');
    const tokenPayload: Omit<AccessTokenPayload, 'iat' | 'exp'> = {
      sub: payload.userId,
      email: payload.email,
      roles: payload.roles,
      sessionId: payload.sessionId,
      jti,
    };
    return this.jwtService.sign(tokenPayload as object, {
      secret: this.configService.get<string>('jwt.accessSecret'),
      expiresIn: (this.configService.get<string>('jwt.accessExpiresIn') ?? '15m') as `${number}${'s' | 'm' | 'h' | 'd'}`,
    });
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    return this.jwtService.verify<AccessTokenPayload>(token, {
      secret: this.configService.get<string>('jwt.accessSecret'),
    });
  }

  async blacklistAccessToken(jti: string, ttlSeconds: number): Promise<void> {
    if (ttlSeconds > 0) {
      await this.redis.set(`${BLACKLIST_PREFIX}${jti}`, '1', 'EX', ttlSeconds);
    }
  }

  async isAccessTokenBlacklisted(jti: string): Promise<boolean> {
    const result = await this.redis.exists(`${BLACKLIST_PREFIX}${jti}`);
    return result === 1;
  }

  // ─── REFRESH TOKEN ───────────────────────────────────────────────────────

  generateRefreshToken(payload: {
    userId: string;
    sessionId: string;
    tokenId: string;
  }): string {
    const tokenPayload: Omit<RefreshTokenPayload, 'iat' | 'exp'> = {
      sub: payload.userId,
      sessionId: payload.sessionId,
      tokenId: payload.tokenId,
    };
    return this.jwtService.sign(tokenPayload as object, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: (this.configService.get<string>('jwt.refreshExpiresIn') ?? '7d') as `${number}${'s' | 'm' | 'h' | 'd'}`,
    });
  }

  verifyRefreshToken(token: string): RefreshTokenPayload {
    return this.jwtService.verify<RefreshTokenPayload>(token, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
    });
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  // ─── REVOCATION ──────────────────────────────────────────────────────────

  async revokeRefreshToken(tokenId: string): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { id: tokenId },
      data: { isRevoked: true, revokedAt: new Date() },
    });
  }

  async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true, revokedAt: new Date() },
    });
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    await this.prisma.loginSession.updateMany({
      where: { userId, status: 'ACTIVE' },
      data: { status: 'REVOKED', loggedOutAt: new Date() },
    });
    await this.revokeAllUserRefreshTokens(userId);
  }

  // ─── TOKEN PAIR ──────────────────────────────────────────────────────────

  async createTokenPair(params: {
    userId: string;
    email: string;
    roles: RoleType[];
    sessionId: string;
  }): Promise<{ accessToken: string; refreshToken: string }> {
    // Pre-create a DB record to get the tokenId
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const dbToken = await this.prisma.refreshToken.create({
      data: {
        userId: params.userId,
        sessionId: params.sessionId,
        tokenHash: 'pending',
        expiresAt,
      },
    });

    const accessToken = this.generateAccessToken(params);
    const refreshToken = this.generateRefreshToken({
      userId: params.userId,
      sessionId: params.sessionId,
      tokenId: dbToken.id,
    });

    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.update({
      where: { id: dbToken.id },
      data: { tokenHash },
    });

    return { accessToken, refreshToken };
  }

  async rotateRefreshToken(params: {
    oldTokenId: string;
    userId: string;
    email: string;
    roles: RoleType[];
    sessionId: string;
  }): Promise<{ accessToken: string; refreshToken: string }> {
    const newPair = await this.createTokenPair({
      userId: params.userId,
      email: params.email,
      roles: params.roles,
      sessionId: params.sessionId,
    });

    // Link old → new in chain, then revoke old
    const newHash = this.hashToken(newPair.refreshToken);
    const newToken = await this.prisma.refreshToken.findFirst({
      where: { tokenHash: newHash },
    });

    await this.prisma.refreshToken.update({
      where: { id: params.oldTokenId },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
        replacedBy: newToken?.id,
      },
    });

    return newPair;
  }

  generateTemp2faToken(userId: string): string {
    return this.jwtService.sign({ sub: userId, type: '2FA_PENDING' }, {
      secret: this.configService.get<string>('jwt.accessSecret'),
      expiresIn: '5m',
    });
  }

  verifyTemp2faToken(token: string): { sub: string; type: string } {
    return this.jwtService.verify<{ sub: string; type: string }>(token, {
      secret: this.configService.get<string>('jwt.accessSecret'),
    });
  }
}
