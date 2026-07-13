'use client';

import { useEffect, useRef, useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/lib/auth/auth.store';
import { ChatMessage, ChatUser } from '@/lib/api/chat.api';
import MessageBubble from './MessageBubble';
import { sendMessage } from '@/lib/api/chat.api';

interface ChatRoomProps {
  conversationId: string;
  otherUser: ChatUser;
  messages: ChatMessage[];
  loadingMessages: boolean;
  connected: boolean;
  sendMessageSocket: (convId: string, text: string) => Promise<ChatMessage | null>;
}

export default function ChatRoom({
  conversationId,
  otherUser,
  messages,
  loadingMessages,
  connected,
  sendMessageSocket,
}: ChatRoomProps) {
  const user = useAuthStore((s) => s.user);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    setSending(true);
    setInput('');

    try {
      if (connected) {
        await sendMessageSocket(conversationId, text);
      } else {
        await sendMessage(conversationId, text);
      }
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="flex items-center gap-3 px-5 py-4 bg-white border-b border-slate-200">
        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm">
          {otherUser.fullName
            .split(' ')
            .map((n) => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-800 truncate">{otherUser.fullName}</h3>
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-400' : 'bg-slate-300'}`}
            />
            {connected ? 'Trực tuyến' : 'Đang kết nối...'}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loadingMessages && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <p className="text-sm">Chưa có tin nhắn nào</p>
            <p className="text-xs mt-1">Gửi tin nhắn đầu tiên để bắt đầu cuộc trò chuyện</p>
          </div>
        ) : (
          messages.map((msg: ChatMessage) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.senderId === user?.id}
              otherUser={otherUser}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-3 bg-white border-t border-slate-200">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập tin nhắn... (Enter để gửi)"
            rows={1}
            className="flex-1 resize-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition-colors max-h-24"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white flex items-center justify-center transition-colors flex-shrink-0"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
