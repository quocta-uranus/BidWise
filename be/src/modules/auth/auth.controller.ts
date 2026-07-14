import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AccessTokenPayload } from '../../common/types/jwt-payload.type';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyReq = any;

const COOKIE_NAME = 'refresh_token';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
  path: '/',
};

function getIp(req: AnyReq): string {
  return (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || '';
}

function setRefreshCookie(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(COOKIE_NAME, { path: '/' });
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(
    @Body() dto: VerifyOtpDto,
    @Req() req: AnyReq,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.verifyEmail(
      dto.userId, dto.otp, getIp(req), req.headers['user-agent'],
    );
    setRefreshCookie(res, result.refreshToken);
    const { refreshToken: _, ...data } = result;
    return data;
  }

  @Public()
  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 86400000 } })
  resendOtp(@Body() dto: ResendOtpDto) {
    return this.authService.resendOtp(dto.userId);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(
    @Body() dto: LoginDto,
    @Req() req: AnyReq,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto, getIp(req), req.headers['user-agent']);
    if ('requires2fa' in result) {
      return result;
    }
    setRefreshCookie(res, result.refreshToken);
    const { refreshToken: _, ...data } = result;
    return data;
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: AnyReq,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rawToken = req.cookies?.[COOKIE_NAME];
    if (!rawToken) {
      res.status(401).json({ message: 'REFRESH_TOKEN_MISSING' });
      return;
    }
    const parts = rawToken.split('.');
    if (parts.length !== 3) {
      res.status(401).json({ message: 'REFRESH_TOKEN_INVALID' });
      return;
    }
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString(),
    ) as { sub: string; tokenId: string; sessionId: string };

    const result = await this.authService.refresh(rawToken, payload);
    setRefreshCookie(res, result.refreshToken);
    return { accessToken: result.accessToken };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: AccessTokenPayload,
    @Body('logoutAll') logoutAll: boolean,
    @Req() req: AnyReq,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = (req.headers['authorization'] ?? '').replace('Bearer ', '');
    await this.authService.logout(user, logoutAll ?? false, token);
    clearRefreshCookie(res);
    return { message: 'Logged out' };
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: AnyReq) {
    return this.authService.forgotPassword(dto.email, getIp(req));
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  changePassword(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: ChangePasswordDto,
    @Req() req: AnyReq,
  ) {
    const token = (req.headers['authorization'] ?? '').replace('Bearer ', '');
    return this.authService.changePassword(user.sub, dto, user, token);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/generate')
  @HttpCode(HttpStatus.OK)
  generate2faSecret(@CurrentUser() user: AccessTokenPayload) {
    return this.authService.generate2faSecret(user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/enable')
  @HttpCode(HttpStatus.OK)
  async enable2fa(
    @CurrentUser() user: AccessTokenPayload,
    @Body('code') code: string,
  ) {
    await this.authService.enable2fa(user.sub, code);
    return { message: '2FA enabled successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/disable')
  @HttpCode(HttpStatus.OK)
  async disable2fa(
    @CurrentUser() user: AccessTokenPayload,
    @Body('code') code: string,
  ) {
    await this.authService.disable2fa(user.sub, code);
    return { message: '2FA disabled successfully' };
  }

  @Public()
  @Post('2fa/verify')
  @HttpCode(HttpStatus.OK)
  async verify2faLogin(
    @Body('twoFactorToken') token: string,
    @Body('code') code: string,
    @Req() req: AnyReq,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.verify2faLogin(token, code, getIp(req), req.headers['user-agent']);
    setRefreshCookie(res, result.refreshToken);
    const { refreshToken: _, ...data } = result;
    return data;
  }
}
