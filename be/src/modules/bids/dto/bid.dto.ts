import { IsInt, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateBidDto {
  @IsString()
  jobId: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsInt()
  @Min(1)
  deliveryDays: number;

  @IsString()
  @MaxLength(5000)
  proposal: string;

  @IsOptional()
  @IsString({ each: true })
  attachments?: string[];
}

export class UpdateBidDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  deliveryDays?: number;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  proposal?: string;
}
