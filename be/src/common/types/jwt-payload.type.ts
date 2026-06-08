import { RoleType } from '@prisma/client';

export class AccessTokenPayload {
  sub: string;
  email: string;
  roles: RoleType[];
  sessionId: string;
  jti: string;
  iat?: number;
  exp?: number;
}

export class RefreshTokenPayload {
  sub: string;
  sessionId: string;
  tokenId: string;
  iat?: number;
  exp?: number;
}
