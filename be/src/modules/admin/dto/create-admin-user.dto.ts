import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { RoleType } from '@prisma/client';

export class CreateAdminUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @MinLength(2)
  fullName: string;

  @IsEnum(RoleType)
  role: RoleType;
}
