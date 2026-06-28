import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class SubmitDeliverableDto {
  @IsNotEmpty()
  @IsString()
  fileName: string;

  @IsOptional()
  @IsString()
  description?: string;
}
