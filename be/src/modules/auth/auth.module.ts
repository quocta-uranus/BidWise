import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { OtpModule } from '../otp/otp.module';
import { TokenModule } from '../token/token.module';
import { SessionModule } from '../session/session.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [OtpModule, TokenModule, SessionModule, EmailModule],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy],
  exports: [AuthService],
})
export class AuthModule {}
