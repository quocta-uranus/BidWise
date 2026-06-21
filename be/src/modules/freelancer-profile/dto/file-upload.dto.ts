import { IsUrl, IsString, IsInt, IsOptional, Min, Max } from 'class-validator';

export class FileUploadDto {
  @IsUrl()
  fileUrl: string;

  @IsOptional()
  @IsString()
  fileName?: string;

  @IsOptional()
  @IsInt()
  fileSize?: number;

  @IsOptional()
  @IsString()
  mimeType?: string;
}
