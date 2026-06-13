import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { randomBytes, createHash } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { OtpService } from '../otp/otp.service';
import { TokenService } from '../token/token.service';
import { SessionService } from '../session/session.service';
import { EmailService } from '../email/email.service';
import { RoleType } from '@prisma/client';
import { generateSecret, verifyTotp } from '../../common/utils/totp.util';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AccessTokenPayload } from '../../common/types/jwt-payload.type';

const BCRYPT_ROUNDS = 12;
const FAILED_LOGIN_LOCK_THRESHOLD = 10;
const LOCK_DURATION_MS = 15 * 60 * 1000;
const RESET_TOKEN_EXPIRY_MINUTES = 30;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private otpService: OtpService,
    private tokenService: TokenService,
    private sessionService: SessionService,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {}

  // ─── REGISTER ────────────────────────────────────────────────────────────

  async register(dto: RegisterDto): Promise<{ userId: string }> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('EMAIL_ALREADY_EXISTS');

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          fullName: dto.fullName,
          status: 'PENDING_VERIFICATION',
        },
      });

      const role = await tx.role.findUnique({ where: { name: dto.role } });
      if (role) {
        await tx.userRole.create({
          data: { userId: newUser.id, roleId: role.id },
        });
      }

      await tx.accountStatusLog.create({
        data: { userId: newUser.id, action: 'REGISTERED' },
      });

      return newUser;
    });

    await this.otpService.generateAndSend(user.id, 'EMAIL_VERIFICATION');

    return { userId: user.id };
  }

  // ─── VERIFY EMAIL ────────────────────────────────────────────────────────

  async verifyEmail(
    userId: string,
    otp: string,
    ipAddress: string,
    userAgent?: string,
  ) {
    await this.otpService.verify(userId, 'EMAIL_VERIFICATION', otp);

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'ACTIVE', emailVerifiedAt: new Date() },
      include: { userRoles: { include: { role: true } } },
    });

    await this.prisma.accountStatusLog.create({
      data: { userId, action: 'EMAIL_VERIFIED' },
    });

    return this.createAuthResponse(user, ipAddress, userAgent);
  }

  // ─── RESEND OTP ──────────────────────────────────────────────────────────

  async resendOtp(userId: string): Promise<{ expiresAt: Date }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('USER_NOT_FOUND');
    if (user.status !== 'PENDING_VERIFICATION') {
      throw new BadRequestException('EMAIL_ALREADY_VERIFIED');
    }

    await this.otpService.generateAndSend(userId, 'EMAIL_VERIFICATION');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    return { expiresAt };
  }

  // ─── LOGIN ───────────────────────────────────────────────────────────────

  async login(dto: LoginDto, ipAddress: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { userRoles: { include: { role: true } } },
    });

    if (!user) throw new UnauthorizedException('INVALID_CREDENTIALS');

    // Brute-force account lock check
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new ForbiddenException({
        error: 'ACCOUNT_LOCKED',
        lockedUntil: user.lockedUntil,
      });
    }

    // Account status check
    if (user.status === 'SUSPENDED') {
      throw new ForbiddenException('ACCOUNT_SUSPENDED');
    }
    if (user.status === 'PENDING_VERIFICATION') {
      throw new ForbiddenException('EMAIL_NOT_VERIFIED');
    }
    if (user.status === 'DEACTIVATED') {
      throw new ForbiddenException('ACCOUNT_DEACTIVATED');
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isValid) {
      const newCount = user.failedLoginCount + 1;
      const lockedUntil =
        newCount >= FAILED_LOGIN_LOCK_THRESHOLD
          ? new Date(Date.now() + LOCK_DURATION_MS)
          : null;

      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginCount: newCount, lockedUntil },
      });
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    if (user.twoFactorEnabled) {
      const twoFactorToken = this.tokenService.generateTemp2faToken(user.id);
      return {
        requires2fa: true,
        twoFactorToken,
        userId: user.id,
      };
    }

    return this.createAuthResponse(user, ipAddress, userAgent);
  }

  // ─── REFRESH TOKEN ───────────────────────────────────────────────────────

  async refresh(refreshToken: string, payload: { sub: string; tokenId: string; sessionId: string }) {
    const tokenHash = this.tokenService.hashToken(refreshToken);

    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: { include: { userRoles: { include: { role: true } } } },
      },
    });

    if (!stored || stored.id !== payload.tokenId) {
      throw new UnauthorizedException('REFRESH_TOKEN_INVALID');
    }

    if (stored.isRevoked) {
      // Token reuse detected → revoke entire session
      await this.tokenService.revokeAllUserSessions(payload.sub);
      throw new UnauthorizedException('TOKEN_REUSE_DETECTED');
    }

    if (new Date() > stored.expiresAt) {
      throw new UnauthorizedException('REFRESH_TOKEN_EXPIRED');
    }

    const roles = stored.user.userRoles.map((ur) => ur.role.name);

    const newPair = await this.tokenService.rotateRefreshToken({
      oldTokenId: stored.id,
      userId: stored.userId,
      email: stored.user.email,
      roles,
      sessionId: stored.sessionId,
    });

    await this.sessionService.touch(stored.sessionId);

    return newPair;
  }

  // ─── LOGOUT ──────────────────────────────────────────────────────────────

  async logout(
    jwtPayload: AccessTokenPayload,
    logoutAll: boolean,
    rawAccessToken: string,
  ): Promise<void> {
    // Blacklist current access token
    const decoded = this.tokenService.verifyAccessToken(rawAccessToken);
    const ttl = (decoded.exp ?? 0) - Math.floor(Date.now() / 1000);
    if (ttl > 0) {
      await this.tokenService.blacklistAccessToken(decoded.jti, ttl);
    }

    if (logoutAll) {
      await this.tokenService.revokeAllUserSessions(jwtPayload.sub);
    } else {
      await this.sessionService.revoke(jwtPayload.sessionId);
    }
  }

  // ─── FORGOT PASSWORD ─────────────────────────────────────────────────────

  async forgotPassword(email: string, ipAddress: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Always return success to avoid email enumeration
    if (!user || user.status !== 'ACTIVE') return;

    // Revoke existing tokens
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, isUsed: false },
      data: { isUsed: true, usedAt: new Date() },
    });

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000);

    await this.prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt, ipAddress },
    });

    const frontendUrl = this.configService.get<string>('app.frontendUrl');
    const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;
    await this.emailService.sendPasswordReset(user.email, user.fullName, resetUrl);
  }

  // ─── RESET PASSWORD ──────────────────────────────────────────────────────

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const tokenHash = createHash('sha256').update(dto.token).digest('hex');

    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!record) throw new BadRequestException('TOKEN_INVALID');
    if (record.isUsed) throw new BadRequestException('TOKEN_ALREADY_USED');
    if (new Date() > record.expiresAt) throw new BadRequestException('TOKEN_EXPIRED');

    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { isUsed: true, usedAt: new Date() },
      }),
      this.prisma.accountStatusLog.create({
        data: { userId: record.userId, action: 'PASSWORD_CHANGED' },
      }),
    ]);

    await this.tokenService.revokeAllUserSessions(record.userId);
  }

  // ─── CHANGE PASSWORD ─────────────────────────────────────────────────────

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
    jwtPayload: AccessTokenPayload,
    rawAccessToken: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });

    const isValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isValid) throw new BadRequestException('CURRENT_PASSWORD_INCORRECT');

    const isSame = await bcrypt.compare(dto.newPassword, user.passwordHash);
    if (isSame) throw new BadRequestException('SAME_AS_CURRENT_PASSWORD');

    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);

    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
      this.prisma.accountStatusLog.create({
        data: { userId, action: 'PASSWORD_CHANGED' },
      }),
    ]);

    // Blacklist current AT and revoke all other sessions
    const decoded = this.tokenService.verifyAccessToken(rawAccessToken);
    const ttl = (decoded.exp ?? 0) - Math.floor(Date.now() / 1000);
    if (ttl > 0) {
      await this.tokenService.blacklistAccessToken(decoded.jti, ttl);
    }
    await this.tokenService.revokeAllUserSessions(userId);
  }

  // ─── HELPERS ─────────────────────────────────────────────────────────────

  private async createAuthResponse(
    user: {
      id: string;
      email: string;
      fullName: string;
      avatarUrl: string | null;
      status: string;
      userRoles: Array<{ role: { name: RoleType } }>;
    },
    ipAddress: string,
    userAgent?: string,
  ) {
    const roles = user.userRoles.map((ur) => ur.role.name);
    const session = await this.sessionService.create({
      userId: user.id,
      ipAddress,
      userAgent,
    });

    const { accessToken, refreshToken } = await this.tokenService.createTokenPair({
      userId: user.id,
      email: user.email,
      roles,
      sessionId: session.id,
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 900,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        roles,
        status: user.status,
      },
    };
  }

  // ─── 2FA ─────────────────────────────────────────────────────────────────

  async generate2faSecret(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const secret = generateSecret();
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret },
    });
    const provisioningUri = `otpauth://totp/BidWise:${user.email}?secret=${secret}&issuer=BidWise`;
    return { secret, provisioningUri };
  }

  async enable2fa(userId: string, code: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.twoFactorSecret) throw new BadRequestException('2FA_NOT_INITIALIZED');
    const isValid = verifyTotp(user.twoFactorSecret, code);
    if (!isValid) throw new BadRequestException('INVALID_2FA_CODE');
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });
  }

  async disable2fa(userId: string, code: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new BadRequestException('2FA_NOT_ENABLED');
    }
    const isValid = verifyTotp(user.twoFactorSecret, code);
    if (!isValid) throw new BadRequestException('INVALID_2FA_CODE');
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    });
  }

  async verify2faLogin(token: string, code: string, ipAddress: string, userAgent?: string) {
    let payload;
    try {
      payload = this.tokenService.verifyTemp2faToken(token);
    } catch {
      throw new UnauthorizedException('INVALID_2FA_TOKEN');
    }
    if (payload.type !== '2FA_PENDING') {
      throw new UnauthorizedException('INVALID_2FA_TOKEN');
    }
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: payload.sub },
      include: { userRoles: { include: { role: true } } },
    });
    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new UnauthorizedException('2FA_NOT_ENABLED');
    }
    const isValid = verifyTotp(user.twoFactorSecret, code);
    if (!isValid) throw new UnauthorizedException('INVALID_2FA_CODE');

    return this.createAuthResponse(user, ipAddress, userAgent);
  }
}
