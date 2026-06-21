import { IsOptional, IsString, IsNumber, IsBoolean, IsInt, Min } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsNumber()
  hourlyRate?: number;

  @IsOptional()
  @IsString()
  experience?: string;

  @IsOptional()
  @IsBoolean()
  available?: boolean;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class AddSkillDto {
  @IsString()
  skill: string;
}

export class SubmitAssessmentDto {
  @IsOptional()
  @IsInt({ each: true })
  @Min(0, { each: true })
  answers?: number[];
}
