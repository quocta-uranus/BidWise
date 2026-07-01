import { IsNumber, IsOptional, IsString, IsBoolean, Min, Max } from 'class-validator';

export class ReviewFreelancerDto {
  @IsNumber()
  @Min(1)
  @Max(5)
  qualityRating: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  commRating: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  speedRating: number;

  @IsString()
  @IsOptional()
  comment?: string;

  @IsBoolean()
  @IsOptional()
  anonymous?: boolean;
}
