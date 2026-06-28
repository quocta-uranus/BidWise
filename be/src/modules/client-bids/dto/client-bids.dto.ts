import { IsString, IsOptional, IsIn } from 'class-validator';

export class ShortlistBidDto {
  @IsString()
  bidId: string;
}

export class BidDecisionDto {
  @IsIn(['ACCEPTED', 'REJECTED'])
  action: 'ACCEPTED' | 'REJECTED';

  @IsOptional()
  @IsString()
  reason?: string;
}

export class CompareBidsDto {
  bidIds: string[];
}
