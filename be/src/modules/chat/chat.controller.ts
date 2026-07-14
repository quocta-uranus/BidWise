import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RoleType } from '@prisma/client';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { CreateConversationDto, SendMessageDto } from './dto/chat.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AccessTokenPayload } from '../../common/types/jwt-payload.type';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleType.CLIENT, RoleType.FREELANCER)
@Controller('chat')
export class ChatController {
  constructor(
    private chatService: ChatService,
    private chatGateway: ChatGateway,
  ) {}

  @Get('conversations')
  listConversations(@CurrentUser() user: AccessTokenPayload) {
    return this.chatService.listConversations(user.sub);
  }

  @Get('unread-count')
  getUnreadCount(@CurrentUser() user: AccessTokenPayload) {
    return this.chatService.getUnreadCount(user.sub);
  }

  @Post('conversations')
  createConversation(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: CreateConversationDto,
  ) {
    return this.chatService.getOrCreateConversation(user.sub, user.roles, dto);
  }

  @Get('conversations/:id/messages')
  getMessages(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.chatService.getMessages(
      id,
      user.sub,
      cursor,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Post('conversations/:id/messages')
  async sendMessage(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ) {
    const message = await this.chatService.sendMessage(id, user.sub, dto.text);
    this.chatGateway.publishMessage(id, message);
    await this.chatGateway.publishConversationUpdate(id, user.sub, message);
    return message;
  }

  @Patch('conversations/:id/read')
  async markAsRead(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
  ) {
    const result = await this.chatService.markAsRead(id, user.sub);
    this.chatGateway.server.to(`conversation:${id}`).emit('messages_read', {
      conversationId: id,
      readBy: user.sub,
      readAt: result.readAt,
    });
    return result;
  }
}
