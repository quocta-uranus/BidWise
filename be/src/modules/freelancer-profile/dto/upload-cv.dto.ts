import { IsString, IsOptional } from 'class-validator';

export class UploadCvDto {
  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsString()
  fileName?: string;

  @IsOptional()
  @IsString()
  fileSize?: string;
}
