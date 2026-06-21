export const BID_STATUS = {
  PENDING: 'PENDING',
  SHORTLISTED: 'SHORTLISTED',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
  WITHDRAWN: 'WITHDRAWN',
} as const;

export const JOB_STATUS = {
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
  AWARDED: 'AWARDED',
} as const;

export const AUCTION_TYPE = {
  OPEN_BID: 'OPEN_BID',
  SEALED_BID: 'SEALED_BID',
} as const;

export type BidStatus = (typeof BID_STATUS)[keyof typeof BID_STATUS];
