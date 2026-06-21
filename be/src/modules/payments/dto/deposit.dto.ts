import { IsNotEmpty, IsNumber, Min } from 'class-validator';

export class DepositDto {
  @IsNumber()
  @Min(10)
  amount: number;

  @IsNotEmpty()
  gateway: string;
}
