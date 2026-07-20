import { IsNumber, IsOptional, IsString, IsBoolean, Min, Max, MinLength } from 'class-validator';

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

  @IsNumber()
  @Min(1)
  @Max(5)
  fourthRating: number;

  @IsString()
  @IsOptional()
  comment?: string;

  @IsBoolean()
  @IsOptional()
  anonymous?: boolean;
}

export class ReviewClientDto {
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

export class ReviewResponseDto {
  @IsString()
  @MinLength(1)
  response: string;
}
