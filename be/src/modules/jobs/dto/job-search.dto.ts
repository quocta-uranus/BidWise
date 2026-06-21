import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsDateString,
  IsArray,
  ValidateNested,
  Min,
  Max,
  ArrayMinSize,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { JobStatus, AuctionType, BudgetFormat } from '@prisma/client';

export class AhpWeightDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  priceWeight: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  skillWeight: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  experienceWeight: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  ratingWeight: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  speedWeight: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  deadlineWeight: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  portfolioWeight: number;
}

export class JobAttachmentDto {
  @IsString()
  fileName: string;

  @IsString()
  fileUrl: string;

  @IsOptional()
  @IsNumber()
  fileSize?: number;

  @IsOptional()
  @IsString()
  mimeType?: string;
}

export class CreateJobDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsEnum(BudgetFormat)
  budgetFormat: BudgetFormat;

  @IsOptional()
  @IsNumber()
  minBudget?: number;

  @IsOptional()
  @IsNumber()
  maxBudget?: number;

  @IsOptional()
  @IsNumber()
  fixedBudget?: number;

  @IsDateString()
  deadline: string;

  @IsString()
  categoryId: string;

  @IsEnum(AuctionType)
  auctionType: AuctionType;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  skills: string[];

  @ValidateNested()
  @Type(() => AhpWeightDto)
  ahpWeight: AhpWeightDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JobAttachmentDto)
  attachments?: JobAttachmentDto[];
}

export class UpdateJobDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(BudgetFormat)
  budgetFormat?: BudgetFormat;

  @IsOptional()
  @IsNumber()
  minBudget?: number;

  @IsOptional()
  @IsNumber()
  maxBudget?: number;

  @IsOptional()
  @IsNumber()
  fixedBudget?: number;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsEnum(AuctionType)
  auctionType?: AuctionType;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;

  @ValidateNested()
  @Type(() => AhpWeightDto)
  ahpWeight?: AhpWeightDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JobAttachmentDto)
  attachments?: JobAttachmentDto[];
}

export class JobSearchDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minBudget?: number;

  @IsOptional()
  @IsNumber()
  maxBudget?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsDateString()
  deadlineBefore?: string;

  @IsOptional()
  @IsEnum(AuctionType)
  auctionType?: AuctionType;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  sortBy?: 'createdAt' | 'budget' | 'deadline' = 'createdAt';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class JobSuggestionDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}
