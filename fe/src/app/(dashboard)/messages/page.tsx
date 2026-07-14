"use client";

import { Suspense, useState } from "react";
import { MessageSquare } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useChat } from "@/hooks/useChat";
import { Conversation } from "@/lib/api/chat.api";
import ChatInbox from "@/components/chat/ChatInbox";
import ChatRoom from "@/components/chat/ChatRoom";

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="h-[calc(100vh-64px)] bg-slate-50" />}>
      <MessagesContent />
    </Suspense>
  );
}

function MessagesContent() {
  const searchParams = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(() =>
    searchParams.get("conversation"),
  );
  const {
    conversations,
    loadingConversations,
    messages,
    loadingMessages,
    connected,
    sendMessageSocket,
  } = useChat(selectedId);
  const selected = conversations.find((item) => item.id === selectedId) ?? null;

  const handleSelect = (conv: Conversation) => {
    setSelectedId(conv.id);
  };

  return (
    <div className="h-[calc(100vh-64px)] flex">
      <div
        className={`w-full md:w-80 lg:w-96 border-r border-slate-200 bg-white flex flex-col ${
          selected ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="px-5 py-4 border-b border-slate-200">
          <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            Tin nhắn
          </h1>
        </div>
        <div className="flex-1 overflow-hidden">
          <ChatInbox
            conversations={conversations}
            loading={loadingConversations}
            selectedId={selected?.id ?? null}
            onSelect={handleSelect}
          />
        </div>
      </div>

      <div className={`flex-1 ${!selected ? "hidden md:flex" : "flex"}`}>
        {selected ? (
          <div className="flex flex-col w-full h-full">
            <button
              onClick={() => setSelectedId(null)}
              className="md:hidden flex items-center gap-2 px-4 py-2 text-sm text-blue-600 bg-white border-b border-slate-200"
            >
              ← Quay lại
            </button>
            <ChatRoom
              conversationId={selected.id}
              otherUser={selected.otherUser}
              messages={messages}
              loadingMessages={loadingMessages}
              connected={connected}
              sendMessageSocket={sendMessageSocket}
            />
          </div>
        ) : (
          <div className="hidden md:flex flex-col items-center justify-center h-full text-slate-400 bg-slate-50">
            <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-sm font-medium">Chọn cuộc hội thoại</p>
            <p className="text-xs mt-1">
              Chọn một cuộc trò chuyện từ danh sách bên trái
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
