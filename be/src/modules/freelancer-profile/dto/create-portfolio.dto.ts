import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreatePortfolioDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  desc?: string;

  @IsOptional()
  @IsString()
  link?: string;

  @IsOptional()
  @IsString()
  fileName?: string;

  @IsOptional()
  @IsString()
  fileSize?: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsString()
  linkType?: string;

  @IsOptional()
  @IsString()
  mimeType?: string;
}
