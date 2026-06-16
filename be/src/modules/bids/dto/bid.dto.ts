import { IsInt, IsNumber, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class CreateBidDto {
  @IsString()
  jobId: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  amount: number;

  @IsInt()
  @Min(1)
  days: number;

  @IsString()
  @MinLength(20)
  @MaxLength(5000)
  coverLetter: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  fileName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  fileUrl?: string;
}

export class UpdateBidDto {
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  amount?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  days?: number;

  @IsOptional()
  @IsString()
  @MinLength(20)
  @MaxLength(5000)
  coverLetter?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  fileName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  fileUrl?: string;
}

export class CoverLetterSuggestDto {
  @IsString()
  jobId: string;
}
