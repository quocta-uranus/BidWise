import { DisputeDecision, ReportCategory, ReportType } from '@prisma/client';
import { IsArray, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateReportDto {
  @IsEnum(ReportType)
  targetType: ReportType;

  @IsString()
  targetId: string;

  @IsEnum(ReportCategory)
  category: ReportCategory;

  @IsString()
  @MinLength(5)
  reason: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  evidenceUrls?: string[];
}

export class OpenDisputeDto {
  @IsString()
  contractId: string;

  @IsString()
  @MinLength(5)
  reason: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  evidenceUrls?: string[];
}

export class SubmitEvidenceDto {
  @IsString()
  @MinLength(1)
  description: string;

  @IsArray()
  @IsString({ each: true })
  fileUrls: string[];
}

export class ResolveDisputeDto {
  @IsEnum(DisputeDecision)
  decision: DisputeDecision;

  @IsString()
  @MinLength(1)
  resolution: string;
}
