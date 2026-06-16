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
