import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ReportAction, ReportStatus, ReportType } from '@prisma/client';

export class CreateCategoryDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isHidden?: boolean;
}

export class CreateSkillDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateSkillDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isHidden?: boolean;
}

export class MergeSkillsDto {
  @IsString()
  sourceSkillId: string;

  @IsString()
  targetSkillId: string;
}

export class HideJobDto {
  @IsString()
  @MinLength(1)
  reason: string;
}

export class ModerateReviewDto {
  @IsBoolean()
  isHidden: boolean;

  @IsOptional()
  @IsString()
  hiddenReason?: string;
}

export class ResolveReportDto {
  @IsEnum(ReportStatus)
  status: ReportStatus;

  @IsOptional()
  @IsString()
  resolution?: string;

  @IsOptional()
  @IsEnum(ReportAction)
  action?: ReportAction;
}

export class UpdateSystemConfigDto {
  @IsString()
  value: string;
}

export class BulkUpdateSystemConfigDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConfigEntryDto)
  configs: ConfigEntryDto[];
}

class ConfigEntryDto {
  @IsString()
  key: string;

  @IsString()
  value: string;
}

export class CreateAssessmentQuestionDto {
  @IsOptional()
  @IsString()
  skillId?: string;

  @IsString()
  @MinLength(1)
  question: string;

  @IsArray()
  @IsString({ each: true })
  options: string[];

  @IsInt()
  @Min(0)
  correctIndex: number;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsInt()
  order?: number;
}

export class UpdateAssessmentQuestionDto {
  @IsOptional()
  @IsString()
  skillId?: string;

  @IsOptional()
  @IsString()
  question?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  correctIndex?: number;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsInt()
  order?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AdminRefundDto {
  @IsString()
  transactionId: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class CreateReportDto {
  @IsEnum(ReportType)
  targetType: ReportType;

  @IsString()
  targetId: string;

  @IsString()
  @MinLength(1)
  reason: string;

  @IsOptional()
  @IsString()
  evidence?: string;
}
