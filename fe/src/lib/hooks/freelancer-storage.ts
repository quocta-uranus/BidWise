const STORAGE_BASE = 'bidwise-freelancer-store';

let activeUserId: string | null = null;

export function setFreelancerStorageUserId(userId: string | null) {
  activeUserId = userId;
}

export function getFreelancerStorageKey(): string {
  return activeUserId ? `${STORAGE_BASE}-${activeUserId}` : `${STORAGE_BASE}-guest`;
}
