import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AiChatService } from './ai-chat.service';
import { ChatMessageDto } from './dto/chat-message.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AccessTokenPayload } from '../../common/types/jwt-payload.type';

@Controller('ai-chat')
export class AiChatController {
  constructor(private readonly aiChatService: AiChatService) {}

  @Post('message')
  @HttpCode(HttpStatus.OK)
  async sendMessage(
    @Body() dto: ChatMessageDto,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    const reply = await this.aiChatService.chat(
      dto.message,
      user.roles as string[],
      user.email,
      dto.history ?? [],
    );
    // TransformResponseInterceptor wraps this in { success, data, timestamp }
    return { reply };
  }
}
