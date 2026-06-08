import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { AccessTokenPayload } from '../../../common/types/jwt-payload.type';
import { TokenService } from '../../token/token.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private tokenService: TokenService,
  ) {
    const secret = configService.get<string>('jwt.accessSecret');
    if (!secret) throw new Error('JWT_ACCESS_SECRET is not configured');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: AccessTokenPayload): Promise<AccessTokenPayload> {
    const blacklisted = await this.tokenService.isAccessTokenBlacklisted(payload.jti);
    if (blacklisted) {
      throw new UnauthorizedException('TOKEN_REVOKED');
    }
    return payload;
  }
}
