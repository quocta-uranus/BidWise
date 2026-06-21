import { IsString, IsOptional } from 'class-validator';

export class AddCertificateDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  issuer?: string;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  verifyLink?: string;

  @IsOptional()
  @IsString()
  imageFileName?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}
