'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getAccessToken } from '@/lib/api/client';
import { useAuthStore } from '@/lib/auth/auth.store';
import {
  ChatMessage,
  Conversation,
  getMessages,
  listConversations,
  markAsRead,
  sendMessage as sendMessageRest,
} from '@/lib/api/chat.api';

const SOCKET_URL =
  (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1').replace(
    '/api/v1',
    '',
  );

let sharedSocket: Socket | null = null;

function getSharedSocket(token: string): Socket {
  if (sharedSocket?.connected) return sharedSocket;

  if (sharedSocket) {
    sharedSocket.disconnect();
  }

  sharedSocket = io(`${SOCKET_URL}/chat`, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
  });

  return sharedSocket;
}

export function useChat(conversationId?: string | null) {
  const userId = useAuthStore((s) => s.user?.id);
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const connectSocket = useCallback(() => {
    const token = getAccessToken();
    if (!token) return null;

    const socket = getSharedSocket(token);
    socketRef.current = socket;
    return socket;
  }, []);

  const loadConversations = useCallback(async () => {
    setLoadingConversations(true);
    try {
      const data = await listConversations();
      setConversations(data);
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  const loadMessages = useCallback(
    async (convId: string, cursor?: string) => {
      setLoadingMessages(true);
      try {
        const data = await getMessages(convId, cursor);
        if (cursor) {
          setMessages((prev) => [...data.messages, ...prev]);
        } else {
          setMessages(data.messages);
        }
        setHasMore(data.hasMore);
        setNextCursor(data.nextCursor);
      } finally {
        setLoadingMessages(false);
      }
    },
    [],
  );

  const joinConversation = useCallback(
    (convId: string) => {
      const socket = connectSocket();
      socket?.emit('join_conversation', { conversationId: convId });
    },
    [connectSocket],
  );

  const leaveConversation = useCallback((convId: string) => {
    socketRef.current?.emit('leave_conversation', { conversationId: convId });
  }, []);

  const sendMessageSocket = useCallback(
    async (convId: string, text: string) => {
      const appendMessage = (message: ChatMessage) => {
        setMessages((prev) => {
          if (prev.some((item) => item.id === message.id)) return prev;
          return [...prev, message];
        });
      };

      if (!connected) {
        const message = await sendMessageRest(convId, text);
        appendMessage(message);
        return message;
      }

      return new Promise<ChatMessage | null>((resolve) => {
        const socket = connectSocket();
        if (!socket) {
          sendMessageRest(convId, text)
            .then((message) => {
              appendMessage(message);
              resolve(message);
            })
            .catch(() => resolve(null));
          return;
        }
        socket.emit(
          'send_message',
          { conversationId: convId, text },
          (response: { success?: boolean; message?: ChatMessage; error?: string }) => {
            if (response?.success && response.message) {
              appendMessage(response.message);
              resolve(response.message);
            } else {
              resolve(null);
            }
          },
        );
      });
    },
    [connectSocket, connected],
  );

  const markConversationRead = useCallback(
    async (convId: string) => {
      const socket = connectSocket();
      socket?.emit('mark_read', { conversationId: convId });
      await markAsRead(convId);
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c)),
      );
    },
    [connectSocket],
  );

  useEffect(() => {
    const socket = connectSocket();
    if (!socket) return;

    const onConnect = () => {
      setConnected(true);
      if (conversationId) {
        socket.emit('join_conversation', { conversationId });
      }
    };
    const onDisconnect = () => setConnected(false);

    const onNewMessage = (data: { conversationId: string; message: ChatMessage }) => {
      if (conversationId && data.conversationId === conversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
      }

      setConversations((prev) =>
        prev
          .map((c) => {
            if (c.id !== data.conversationId) return c;
            const isFromOther = data.message.senderId !== userId;
            return {
              ...c,
              lastMessage: data.message,
              lastMessageAt: data.message.createdAt,
              unreadCount:
                isFromOther && data.conversationId !== conversationId
                  ? c.unreadCount + 1
                  : c.unreadCount,
            };
          })
          .sort((a, b) => {
            const aTime = a.lastMessageAt ?? a.createdAt;
            const bTime = b.lastMessageAt ?? b.createdAt;
            return new Date(bTime).getTime() - new Date(aTime).getTime();
          }),
      );
    };

    const onConversationUpdated = (data: {
      conversationId: string;
      lastMessage: ChatMessage;
    }) => {
      setConversations((prev) =>
        prev
          .map((c) =>
            c.id === data.conversationId
              ? {
                  ...c,
                  lastMessage: data.lastMessage,
                  lastMessageAt: data.lastMessage.createdAt,
                }
              : c,
          )
          .sort((a, b) => {
            const aTime = a.lastMessageAt ?? a.createdAt;
            const bTime = b.lastMessageAt ?? b.createdAt;
            return new Date(bTime).getTime() - new Date(aTime).getTime();
          }),
      );
    };

    const onMessagesRead = (data: { conversationId: string; readAt: string }) => {
      if (conversationId && data.conversationId === conversationId) {
        setMessages((prev) =>
          prev.map((m) => (m.readAt ? m : { ...m, readAt: data.readAt })),
        );
      }
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('new_message', onNewMessage);
    socket.on('conversation_updated', onConversationUpdated);
    socket.on('messages_read', onMessagesRead);

    if (socket.connected) setConnected(true);
    loadConversations();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('new_message', onNewMessage);
      socket.off('conversation_updated', onConversationUpdated);
      socket.off('messages_read', onMessagesRead);
    };
  }, [connectSocket, loadConversations, conversationId, userId]);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    joinConversation(conversationId);
    loadMessages(conversationId);
    markConversationRead(conversationId);

    return () => {
      leaveConversation(conversationId);
    };
  }, [
    conversationId,
    joinConversation,
    leaveConversation,
    loadMessages,
    markConversationRead,
  ]);

  return {
    connected,
    conversations,
    messages,
    loadingConversations,
    loadingMessages,
    hasMore,
    nextCursor,
    loadConversations,
    loadMessages,
    sendMessageSocket,
    markConversationRead,
  };
}

export function useUnreadCount() {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const { getUnreadCount } = await import('@/lib/api/chat.api');
      const total = await getUnreadCount();
      setCount(total);
    } catch {
      setCount(0);
    }
  }, []);

  useEffect(() => {
    refresh();

    const token = getAccessToken();
    if (!token) return;

    const socket = getSharedSocket(token);
    const onUpdate = () => refresh();

    socket.on('new_message', onUpdate);
    socket.on('conversation_updated', onUpdate);

    return () => {
      socket.off('new_message', onUpdate);
      socket.off('conversation_updated', onUpdate);
    };
  }, [refresh]);

  return { count, refresh };
}
