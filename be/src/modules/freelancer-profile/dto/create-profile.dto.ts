import { IsOptional, IsString, IsNumber, IsBoolean, Min, Max } from 'class-validator';

export class CreateProfileDto {
  @IsOptional()
  @IsString()
  hourlyRate?: number;

  @IsOptional()
  @IsString()
  experience?: string;

  @IsOptional()
  @IsBoolean()
  available?: boolean;
}
