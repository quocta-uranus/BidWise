import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateJobDto } from './create-job.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { JobStatus } from '@prisma/client';

export class UpdateJobDto extends PartialType(
  OmitType(CreateJobDto, ['categoryId'] as const),
) {
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;
}
