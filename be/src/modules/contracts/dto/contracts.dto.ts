import { IsArray, IsDateString, IsInt, IsNumber, IsOptional, IsString, Max, Min, ValidateNested, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMilestoneDto {
  @IsNumber()
  order: number;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  percentage: number;

  @IsDateString()
  deadline: string;

  @IsOptional()
  @IsNumber()
  maxRevisions?: number;
}

export class CreateContractDto {
  @IsString()
  bidId: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  customTerms?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMilestoneDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  milestones: CreateMilestoneDto[];
}

export class SubmitMilestoneDto {
  @IsOptional()
  @IsString()
  freelancerNotes?: string;

  @IsOptional()
  @IsArray()
  deliverables?: {
    fileName: string;
    fileUrl: string;
    fileSize?: number;
    mimeType?: string;
    description?: string;
  }[];
}

export class ReviewMilestoneDto {
  @IsString()
  action: 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED';

  @IsOptional()
  @IsString()
  feedback?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;
}

export class CancelContractDto {
  @IsString()
  reason: string;
}
