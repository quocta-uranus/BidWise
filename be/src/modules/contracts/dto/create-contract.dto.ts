import { IsNotEmpty, IsString } from 'class-validator';

export class CreateContractDto {
  @IsNotEmpty()
  @IsString()
  bidId: string;
}
