import { api } from './client';

export interface ChatUser {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  email: string;
}

export interface ChatMessage {
  id: string;
  conversationId?: string;
  senderId: string;
  text: string;
  readAt: string | null;
  createdAt: string;
  sender?: ChatUser;
}

export interface Conversation {
  id: string;
  clientId: string;
  freelancerId: string;
  jobId: string | null;
  lastMessageAt: string | null;
  createdAt: string;
  otherUser: ChatUser;
  lastMessage: ChatMessage | null;
  unreadCount: number;
}

export interface CreateConversationDto {
  otherUserId: string;
  jobId?: string;
}

export async function listConversations(): Promise<Conversation[]> {
  const res = await api.get<{ data: Conversation[] }>('/chat/conversations');
  return res.data.data;
}

export async function getUnreadCount(): Promise<number> {
  const res = await api.get<{ data: { total: number } }>('/chat/unread-count');
  return res.data.data.total;
}

export async function createConversation(
  dto: CreateConversationDto,
): Promise<Conversation> {
  const res = await api.post<{ data: Conversation }>('/chat/conversations', dto);
  return res.data.data;
}

export async function getMessages(
  conversationId: string,
  cursor?: string,
  limit = 50,
): Promise<{ messages: ChatMessage[]; hasMore: boolean; nextCursor: string | null }> {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  params.set('limit', String(limit));
  const res = await api.get<{
    data: { messages: ChatMessage[]; hasMore: boolean; nextCursor: string | null };
  }>(`/chat/conversations/${conversationId}/messages?${params}`);
  return res.data.data;
}

export async function sendMessage(
  conversationId: string,
  text: string,
): Promise<ChatMessage> {
  const res = await api.post<{ data: ChatMessage }>(
    `/chat/conversations/${conversationId}/messages`,
    { text },
  );
  return res.data.data;
}

export async function markAsRead(
  conversationId: string,
): Promise<{ markedCount: number; readAt: string }> {
  const res = await api.patch<{ data: { markedCount: number; readAt: string } }>(
    `/chat/conversations/${conversationId}/read`,
  );
  return res.data.data;
}
