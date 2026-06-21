import { IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit: number = 20;
}

export class JobBrowseDto extends PaginationDto {
  @IsOptional()
  sortBy?: string = 'NEWEST';

  @IsOptional()
  category?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  minBudget?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  maxBudget?: number;

  @IsOptional()
  skill?: string;

  @IsOptional()
  auctionType?: 'SEALED_BID' | 'OPEN_BID';

  @IsOptional()
  keyword?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  deadlineWithinDays?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
