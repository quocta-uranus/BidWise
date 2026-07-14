import { IsString, IsOptional, IsIn, IsArray, ArrayMinSize, ArrayMaxSize, IsNumber, Min } from 'class-validator';

export class ShortlistBidDto {
  @IsString()
  bidId: string;
}

export class BidDecisionDto {
  @IsIn(['ACCEPTED', 'REJECTED'])
  action: 'ACCEPTED' | 'REJECTED';

  @IsOptional()
  @IsString()
  reason?: string;
}

export class CompareBidsDto {
  bidIds: string[];
}

export class ValidateAhpDto {
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(10)
  matrix: number[][];
}

export class AhpMatrixRowDto {
  @IsArray()
  @IsNumber({}, { each: true })
  @Min(0.01, { each: true })
  values: number[];
}
