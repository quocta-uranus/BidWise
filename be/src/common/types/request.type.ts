import type { Request } from 'express';
import { AccessTokenPayload } from './jwt-payload.type';

export interface AuthenticatedRequest extends Request {
  user: AccessTokenPayload;
}
