import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { TokenService } from '../token/token.service';
import { AccessTokenPayload } from '../../common/types/jwt-payload.type';

interface AuthenticatedSocket extends Socket {
  data: { user: AccessTokenPayload };
}

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private chatService: ChatService,
    private tokenService: TokenService,
    private configService: ConfigService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        (client.handshake.auth?.token as string) ||
        (client.handshake.headers?.authorization as string)?.replace(
          'Bearer ',
          '',
        );

      if (!token) {
        void client.disconnect();
        return;
      }

      const payload = this.tokenService.verifyAccessToken(token);
      const blacklisted = await this.tokenService.isAccessTokenBlacklisted(
        payload.jti,
      );
      if (blacklisted) {
        void client.disconnect();
        return;
      }

      client.data.user = payload;
      void client.join(`user:${payload.sub}`);
      this.logger.debug(`Client connected: ${payload.sub}`);
    } catch {
      void client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.data?.user) {
      this.logger.debug(`Client disconnected: ${client.data.user.sub}`);
    }
  }

  publishMessage(
    conversationId: string,
    message: Awaited<ReturnType<ChatService['sendMessage']>>,
  ) {
    this.server
      .to(`conversation:${conversationId}`)
      .emit('new_message', { conversationId, message });
  }

  async publishConversationUpdate(
    conversationId: string,
    senderId: string,
    message: Awaited<ReturnType<ChatService['sendMessage']>>,
  ) {
    const conversation = await this.chatService.assertParticipant(
      conversationId,
      senderId,
    );
    const recipientId =
      conversation.clientId === senderId
        ? conversation.freelancerId
        : conversation.clientId;
    this.server.to(`user:${recipientId}`).emit('conversation_updated', {
      conversationId,
      lastMessage: message,
    });
  }

  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    const user = client.data.user;
    if (!user || !data?.conversationId) return { error: 'Unauthorized' };

    try {
      await this.chatService.assertParticipant(data.conversationId, user.sub);
      void client.join(`conversation:${data.conversationId}`);
      return { success: true };
    } catch {
      return { error: 'Forbidden' };
    }
  }

  @SubscribeMessage('leave_conversation')
  handleLeaveConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    if (data?.conversationId) {
      void client.leave(`conversation:${data.conversationId}`);
    }
    return { success: true };
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string; text: string },
  ) {
    const user = client.data.user;
    if (!user || !data?.conversationId || !data?.text?.trim()) {
      return { error: 'Invalid message' };
    }

    try {
      const message = await this.chatService.sendMessage(
        data.conversationId,
        user.sub,
        data.text,
      );

      this.publishMessage(data.conversationId, message);
      await this.publishConversationUpdate(
        data.conversationId,
        user.sub,
        message,
      );

      return { success: true, message };
    } catch (err) {
      this.logger.error('send_message error', err);
      return { error: 'Failed to send message' };
    }
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    const user = client.data.user;
    if (!user || !data?.conversationId) return { error: 'Unauthorized' };

    try {
      const result = await this.chatService.markAsRead(
        data.conversationId,
        user.sub,
      );

      this.server
        .to(`conversation:${data.conversationId}`)
        .emit('messages_read', {
          conversationId: data.conversationId,
          readBy: user.sub,
          readAt: result.readAt,
        });

      return { success: true, ...result };
    } catch {
      return { error: 'Failed to mark as read' };
    }
  }
}
