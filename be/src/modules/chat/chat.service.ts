import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RoleType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConversationDto } from './dto/chat.dto';

const USER_SELECT = {
  id: true,
  fullName: true,
  avatarUrl: true,
  email: true,
} as const;

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async listConversations(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [{ clientId: userId }, { freelancerId: userId }],
      },
      orderBy: [{ lastMessageAt: 'desc' }, { updatedAt: 'desc' }],
      include: {
        client: { select: USER_SELECT },
        freelancer: { select: USER_SELECT },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    const unreadCounts = await Promise.all(
      conversations.map((c) =>
        this.getUnreadCountForConversation(c.id, userId),
      ),
    );

    return conversations.map((c, i) => {
      const otherUser = c.clientId === userId ? c.freelancer : c.client;
      const lastMessage = c.messages[0] ?? null;
      return {
        id: c.id,
        clientId: c.clientId,
        freelancerId: c.freelancerId,
        jobId: c.jobId,
        lastMessageAt: c.lastMessageAt,
        createdAt: c.createdAt,
        otherUser,
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              text: lastMessage.text,
              senderId: lastMessage.senderId,
              createdAt: lastMessage.createdAt,
              readAt: lastMessage.readAt,
            }
          : null,
        unreadCount: unreadCounts[i],
      };
    });
  }

  async getOrCreateConversation(
    userId: string,
    roles: RoleType[],
    dto: CreateConversationDto,
  ) {
    const isClient = roles.includes(RoleType.CLIENT);
    const isFreelancer = roles.includes(RoleType.FREELANCER);

    if (!isClient && !isFreelancer) {
      throw new ForbiddenException('Only clients and freelancers can chat');
    }

    const recipient = await this.prisma.user.findUnique({
      where: { id: dto.otherUserId },
      select: {
        id: true,
        userRoles: { include: { role: { select: { name: true } } } },
      },
    });
    if (!recipient) throw new NotFoundException('Chat recipient not found');

    const otherRoles = recipient.userRoles.map((item) => item.role.name);
    let clientId: string;
    let freelancerId: string;

    if (isClient && !isFreelancer) {
      clientId = userId;
      if (!otherRoles.includes(RoleType.FREELANCER)) {
        throw new ForbiddenException('Recipient must be a freelancer');
      }
      freelancerId = dto.otherUserId;
    } else if (isFreelancer && !isClient) {
      freelancerId = userId;
      if (!otherRoles.includes(RoleType.CLIENT)) {
        throw new ForbiddenException('Recipient must be a client');
      }
      clientId = dto.otherUserId;
    } else {
      // User has both roles — infer from existing conversation or default to client
      const existing = await this.prisma.conversation.findFirst({
        where: {
          OR: [
            { clientId: userId, freelancerId: dto.otherUserId },
            { clientId: dto.otherUserId, freelancerId: userId },
          ],
          jobId: dto.jobId ?? null,
        },
      });
      if (existing) {
        clientId = existing.clientId;
        freelancerId = existing.freelancerId;
      } else {
        if (!otherRoles.includes(RoleType.FREELANCER)) {
          throw new ForbiddenException('Recipient must be a freelancer');
        }
        clientId = userId;
        freelancerId = dto.otherUserId;
      }
    }

    if (clientId === freelancerId) {
      throw new ForbiddenException('Cannot chat with yourself');
    }

    if (dto.jobId) {
      const job = await this.prisma.job.findUnique({
        where: { id: dto.jobId },
        select: {
          clientId: true,
          bids: { where: { freelancerId }, select: { id: true }, take: 1 },
        },
      });
      if (!job || job.clientId !== clientId || job.bids.length === 0) {
        throw new ForbiddenException(
          'Chat participants are not related to this job',
        );
      }
    }

    const scopeKey = `${clientId}:${freelancerId}:${dto.jobId ?? 'direct'}`;

    const existing = await this.prisma.conversation.findUnique({
      where: { scopeKey },
      include: {
        client: { select: USER_SELECT },
        freelancer: { select: USER_SELECT },
      },
    });

    if (existing) {
      const otherUser =
        existing.clientId === userId ? existing.freelancer : existing.client;
      return { ...existing, otherUser };
    }

    const conversation = await this.prisma.conversation.create({
      data: {
        clientId,
        freelancerId,
        jobId: dto.jobId ?? null,
        scopeKey,
      },
      include: {
        client: { select: USER_SELECT },
        freelancer: { select: USER_SELECT },
      },
    });

    const otherUser =
      conversation.clientId === userId
        ? conversation.freelancer
        : conversation.client;

    return { ...conversation, otherUser };
  }

  async getMessages(
    conversationId: string,
    userId: string,
    cursor?: string,
    limit = 50,
  ) {
    await this.assertParticipant(conversationId, userId);

    const take = Math.min(Math.max(limit, 1), 100);

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        sender: { select: USER_SELECT },
      },
    });

    const hasMore = messages.length > take;
    const items = hasMore ? messages.slice(0, take) : messages;

    return {
      messages: items.reverse(),
      hasMore,
      nextCursor: hasMore ? items[0]?.id : null,
    };
  }

  async sendMessage(conversationId: string, userId: string, text: string) {
    await this.assertParticipant(conversationId, userId);

    const message = await this.prisma.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: {
          conversationId,
          senderId: userId,
          text: text.trim(),
        },
        include: {
          sender: { select: USER_SELECT },
        },
      });

      await tx.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: created.createdAt },
      });

      return created;
    });

    return message;
  }

  async markAsRead(conversationId: string, userId: string) {
    await this.assertParticipant(conversationId, userId);

    const now = new Date();
    const result = await this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        readAt: null,
      },
      data: { readAt: now },
    });

    return { markedCount: result.count, readAt: now };
  }

  async getUnreadCount(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [{ clientId: userId }, { freelancerId: userId }],
      },
      select: { id: true },
    });

    if (conversations.length === 0) return { total: 0 };

    const counts = await Promise.all(
      conversations.map((c) =>
        this.getUnreadCountForConversation(c.id, userId),
      ),
    );

    return { total: counts.reduce((sum, n) => sum + n, 0) };
  }

  async assertParticipant(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (
      conversation.clientId !== userId &&
      conversation.freelancerId !== userId
    ) {
      throw new ForbiddenException('Not a participant of this conversation');
    }

    return conversation;
  }

  private async getUnreadCountForConversation(
    conversationId: string,
    userId: string,
  ) {
    return this.prisma.message.count({
      where: {
        conversationId,
        senderId: { not: userId },
        readAt: null,
      },
    });
  }
}
