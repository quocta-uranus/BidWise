'use client';

import { ChatMessage, ChatUser } from '@/lib/api/chat.api';

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  showAvatar?: boolean;
  otherUser?: ChatUser;
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function UserAvatar({ user, size = 32 }: { user?: ChatUser; size?: number }) {
  const initials = user?.fullName
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? '?';

  if (user?.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.fullName}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {initials}
    </div>
  );
}

export default function MessageBubble({
  message,
  isOwn,
  showAvatar = true,
  otherUser,
}: MessageBubbleProps) {
  return (
    <div
      className={`flex items-end gap-2 mb-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {showAvatar && !isOwn && <UserAvatar user={otherUser ?? message.sender} size={30} />}
      {!showAvatar && !isOwn && <div className="w-[30px] flex-shrink-0" />}

      <div className={`max-w-[75%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
            isOwn
              ? 'bg-blue-600 text-white rounded-2xl rounded-br-sm shadow-md shadow-blue-600/20'
              : 'bg-white text-slate-800 rounded-2xl rounded-bl-sm shadow-sm border border-slate-100'
          }`}
        >
          {message.text}
        </div>
        <span className="text-[10px] text-slate-400 mt-1 px-1">
          {formatTime(message.createdAt)}
          {isOwn && message.readAt && ' · Đã xem'}
        </span>
      </div>
    </div>
  );
}
