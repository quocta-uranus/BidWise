import { IsNotEmpty, IsNumber, Min, IsString } from 'class-validator';

export class WithdrawDto {
  @IsNumber()
  @Min(10)
  amount: number;

  @IsNotEmpty()
  @IsString()
  method: string;

  @IsNotEmpty()
  @IsString()
  details: string;
}
