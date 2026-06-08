import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';

class TooManyRequestsException extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.TOO_MANY_REQUESTS);
  }
}
import * as bcrypt from 'bcryptjs';
import { OtpType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const MAX_SEND_COUNT = 5;
const RESEND_COOLDOWN_SECONDS = 60;

@Injectable()
export class OtpService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async generateAndSend(userId: string, type: OtpType): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    // Check existing PENDING otp for cooldown & send limit
    const existing = await this.prisma.otpVerification.findFirst({
      where: { userId, type, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      const totalSent = existing.sendCount;
      if (totalSent >= MAX_SEND_COUNT) {
        throw new TooManyRequestsException('OTP_SEND_LIMIT_EXCEEDED');
      }
      const cooldownEnd = new Date(
        existing.updatedAt.getTime() + RESEND_COOLDOWN_SECONDS * 1000,
      );
      if (new Date() < cooldownEnd) {
        throw new TooManyRequestsException('OTP_RESEND_COOLDOWN');
      }

      // Revoke old OTP
      await this.prisma.otpVerification.update({
        where: { id: existing.id },
        data: { status: 'REVOKED' },
      });
    }

    const code = this.generateCode();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await this.prisma.otpVerification.create({
      data: {
        userId,
        type,
        codeHash,
        expiresAt,
        sendCount: (existing?.sendCount ?? 0) + 1,
      },
    });

    // DEV: in OTP ra console để debug khi email chưa config
    console.log(`\n========================================`);
    console.log(`  OTP [${type}] cho ${user.email}: ${code}`);
    console.log(`  Hết hạn lúc: ${expiresAt.toISOString()}`);
    console.log(`========================================\n`);

    if (type === 'EMAIL_VERIFICATION') {
      try {
        await this.emailService.sendOtpVerification(user.email, user.fullName, code);
      } catch (err) {
        console.error(`[EmailService] Gửi email thất bại: ${err}`);
      }
    }
  }

  async verify(userId: string, type: OtpType, code: string): Promise<void> {
    const otp = await this.prisma.otpVerification.findFirst({
      where: { userId, type, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      throw new BadRequestException('OTP_NOT_FOUND');
    }

    if (new Date() > otp.expiresAt) {
      await this.prisma.otpVerification.update({
        where: { id: otp.id },
        data: { status: 'EXPIRED' },
      });
      throw new BadRequestException('OTP_EXPIRED');
    }

    const newAttemptCount = otp.attemptCount + 1;

    const isValid = await bcrypt.compare(code, otp.codeHash);

    if (!isValid) {
      if (newAttemptCount >= MAX_ATTEMPTS) {
        await this.prisma.otpVerification.update({
          where: { id: otp.id },
          data: { status: 'REVOKED', attemptCount: newAttemptCount },
        });
        throw new BadRequestException('OTP_MAX_ATTEMPTS_EXCEEDED');
      }

      await this.prisma.otpVerification.update({
        where: { id: otp.id },
        data: { attemptCount: newAttemptCount },
      });
      throw new BadRequestException('OTP_INVALID');
    }

    await this.prisma.otpVerification.update({
      where: { id: otp.id },
      data: { status: 'VERIFIED', verifiedAt: new Date(), attemptCount: newAttemptCount },
    });
  }

  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
