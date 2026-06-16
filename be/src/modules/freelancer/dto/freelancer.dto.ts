import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LINK_TYPES } from '../constants/upload.constants';

export class UpdateFreelancerProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(10000)
  hourlyRate?: number;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  experience?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  skills?: string[];
}

export class ToggleAvailableDto {
  @IsBoolean()
  available: boolean;
}

export class CreatePortfolioDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  desc?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  link?: string;

  @IsOptional()
  @IsIn(LINK_TYPES)
  linkType?: string;
}

export class CreateCertificateDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  issuer: string;

  @IsString()
  @MinLength(4)
  @MaxLength(20)
  date: string;

  @IsString()
  @MaxLength(2048)
  verifyLink: string;
}

export class AssessmentAnswerDto {
  @IsString()
  questionId: string;

  @IsInt()
  @Min(0)
  @Max(10)
  selectedIndex: number;
}

export class SubmitAssessmentDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssessmentAnswerDto)
  answers: AssessmentAnswerDto[];
}
