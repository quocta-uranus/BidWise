import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateConversationDto {
  @IsString()
  @IsNotEmpty()
  otherUserId: string;

  @IsOptional()
  @IsString()
  jobId?: string;
}

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  text: string;
}

export class GetMessagesQueryDto {
  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  limit?: number;
}
