import { BadRequestException } from '@nestjs/common';
import { RoleType } from '@prisma/client';

// "Portal" roles are the two business-side roles that a normal user
// can pick when signing up. ADMIN / MODERATOR are not portal roles.
const PORTAL_ROLES: RoleType[] = [RoleType.CLIENT, RoleType.FREELANCER];

export function isPortalRole(role: RoleType): boolean {
  return PORTAL_ROLES.includes(role);
}

/**
 * Throws if the given list of roles contains both CLIENT and FREELANCER.
 * Each user account may only belong to ONE portal to keep dashboards,
 * caches, and the role-based UI from leaking data between accounts.
 */
export function assertNoPortalMix(roles: RoleType[]): void {
  const hasClient = roles.includes(RoleType.CLIENT);
  const hasFreelancer = roles.includes(RoleType.FREELANCER);
  if (hasClient && hasFreelancer) {
    throw new BadRequestException(
      'INVALID_ROLE_COMBINATION: an account cannot be both CLIENT and FREELANCER. Use a separate account for the other portal.',
    );
  }
}
