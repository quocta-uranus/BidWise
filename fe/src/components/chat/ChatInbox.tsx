'use client';

import { Conversation } from '@/lib/api/chat.api';
import { Loader2, MessageSquare } from 'lucide-react';

interface ChatInboxProps {
  conversations: Conversation[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (conversation: Conversation) => void;
}

function formatRelativeTime(dateStr: string | null) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút`;
  if (diffHours < 24) return `${diffHours} giờ`;
  if (diffDays < 7) return `${diffDays} ngày`;
  return date.toLocaleDateString('vi-VN');
}

export default function ChatInbox({
  conversations,
  loading,
  selectedId,
  onSelect,
}: ChatInboxProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 px-6 text-center">
        <MessageSquare className="w-12 h-12 mb-3 opacity-30" />
        <p className="text-sm font-medium">Chưa có cuộc hội thoại</p>
        <p className="text-xs mt-1">
          Bắt đầu trò chuyện với client hoặc freelancer từ hợp đồng hoặc dự án
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-full">
      {conversations.map((conv) => {
        const isSelected = conv.id === selectedId;
        const initials = conv.otherUser.fullName
          .split(' ')
          .map((n) => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase();

        return (
          <button
            key={conv.id}
            onClick={() => onSelect(conv)}
            className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors border-b border-slate-100 ${
              isSelected
                ? 'bg-blue-50 border-l-2 border-l-blue-600'
                : 'hover:bg-slate-50 border-l-2 border-l-transparent'
            }`}
          >
            <div className="relative flex-shrink-0">
              {conv.otherUser.avatarUrl ? (
                <img
                  src={conv.otherUser.avatarUrl}
                  alt={conv.otherUser.fullName}
                  className="w-11 h-11 rounded-full object-cover"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm">
                  {initials}
                </div>
              )}
              {conv.unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`text-sm truncate ${conv.unreadCount > 0 ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}
                >
                  {conv.otherUser.fullName}
                </span>
                <span className="text-[10px] text-slate-400 flex-shrink-0">
                  {formatRelativeTime(conv.lastMessageAt ?? conv.createdAt)}
                </span>
              </div>
              <p
                className={`text-xs truncate mt-0.5 ${conv.unreadCount > 0 ? 'text-slate-700 font-medium' : 'text-slate-400'}`}
              >
                {conv.lastMessage?.text ?? 'Chưa có tin nhắn'}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
