'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { sendChatMessage, ChatHistoryItem } from '@/lib/api/ai-chat.api';
import { useAuthStore } from '@/lib/auth/auth.store';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

/* ─── Cute animated bot icon (SVG) ─────────────────────────── */
function BotIcon({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Antenna */}
      <line x1="32" y1="6" x2="32" y2="16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <circle cx="32" cy="5" r="3" fill="currentColor" />
      {/* Head */}
      <rect x="10" y="16" width="44" height="32" rx="12" fill="currentColor" opacity="0.15" />
      <rect x="10" y="16" width="44" height="32" rx="12" stroke="currentColor" strokeWidth="2.5" />
      {/* Eyes */}
      <circle cx="23" cy="30" r="4.5" fill="currentColor" />
      <circle cx="41" cy="30" r="4.5" fill="currentColor" />
      <circle cx="24.5" cy="28.5" r="1.5" fill="white" />
      <circle cx="42.5" cy="28.5" r="1.5" fill="white" />
      {/* Smile */}
      <path d="M24 38 Q32 44 40 38" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* Arms */}
      <rect x="2" y="30" width="8" height="14" rx="4" fill="currentColor" opacity="0.7" />
      <rect x="54" y="30" width="8" height="14" rx="4" fill="currentColor" opacity="0.7" />
      {/* Legs */}
      <rect x="18" y="48" width="10" height="10" rx="4" fill="currentColor" opacity="0.7" />
      <rect x="36" y="48" width="10" height="10" rx="4" fill="currentColor" opacity="0.7" />
    </svg>
  );
}

/* ─── Typing indicator ──────────────────────────────────────── */
function TypingDots() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 0' }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: '#60a5fa',
            display: 'inline-block',
            animation: `chatBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Single message bubble ─────────────────────────────────── */
function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        gap: 8,
        marginBottom: 12,
        animation: 'chatSlideIn 0.25s ease-out',
      }}
    >
      {/* Avatar */}
      {!isUser && (
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: 'white',
          }}
        >
          <BotIcon size={18} />
        </div>
      )}
      {/* Bubble */}
      <div
        style={{
          maxWidth: '78%',
          padding: '10px 14px',
          borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          background: isUser
            ? 'linear-gradient(135deg, #2563eb, #3b82f6)'
            : 'rgba(255,255,255,0.85)',
          color: isUser ? 'white' : '#1e293b',
          fontSize: 13.5,
          lineHeight: 1.55,
          boxShadow: isUser
            ? '0 2px 12px rgba(37,99,235,0.3)'
            : '0 2px 8px rgba(0,0,0,0.08)',
          backdropFilter: 'blur(8px)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {msg.text}
      </div>
    </div>
  );
}

/* ─── Main ChatWidget ───────────────────────────────────────── */
export default function ChatWidget() {
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `Xin chào${user ? ' ' + user.email.split('@')[0] : ''}! 👋 Mình là BidWise AI, sẵn sàng hỗ trợ bạn. Hỏi mình bất cứ điều gì nhé! 🚀`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pulse, setPulse] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Stop pulse after first open
  useEffect(() => {
    if (open) setPulse(false);
  }, [open]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Build history (exclude welcome msg)
    const history: ChatHistoryItem[] = messages
      .filter((m) => m.id !== 'welcome')
      .map((m) => ({ role: m.role, text: m.text }));

    try {
      const reply = await sendChatMessage(text, history);
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: 'model', text: reply, timestamp: new Date() },
      ]);
    } catch (err: unknown) {
      console.error('[BidWise AI] Chat error:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      const isAuth = errMsg.includes('401') || errMsg.includes('Unauthorized');
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'model',
          text: isAuth
            ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng xuất và đăng nhập lại 🔐'
            : 'Oops! Mình đang gặp sự cố kết nối. Vui lòng thử lại sau nhé 🙏',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }

  }, [input, loading, messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* ── CSS keyframes injected once ── */}
      <style>{`
        @keyframes chatBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes chatSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes chatPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(37,99,235,0.6); }
          50% { box-shadow: 0 0 0 10px rgba(37,99,235,0); }
        }
        @keyframes chatOpen {
          from { opacity: 0; transform: scale(0.85) translateY(16px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .chat-widget-window {
          animation: chatOpen 0.28s cubic-bezier(0.34,1.56,0.64,1) forwards;
        }
        .chat-send-btn:hover { opacity: 0.88; transform: scale(1.05); }
        .chat-send-btn:active { transform: scale(0.97); }
        .chat-toggle-btn:hover { transform: scale(1.08); }
        .chat-toggle-btn:active { transform: scale(0.95); }
      `}</style>

      <div
        style={{
          position: 'fixed',
          bottom: 28,
          right: 28,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 12,
        }}
      >
        {/* ── Chat Window ── */}
        {open && (
          <div
            className="chat-widget-window"
            style={{
              width: 360,
              height: 520,
              borderRadius: 24,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              background: 'rgba(248,250,252,0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(148,163,184,0.25)',
              boxShadow:
                '0 25px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(37,99,235,0.12)',
            }}
          >
            {/* Header */}
            <div
              style={{
                background: 'linear-gradient(135deg, #1e3251 0%, #2563eb 100%)',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  border: '2px solid rgba(255,255,255,0.3)',
                }}
              >
                <BotIcon size={22} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>
                  BidWise AI
                </div>
                <div
                  style={{
                    color: 'rgba(255,255,255,0.72)',
                    fontSize: 11.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: '#4ade80',
                      display: 'inline-block',
                      boxShadow: '0 0 6px #4ade80',
                    }}
                  />
                  Luôn sẵn sàng hỗ trợ
                </div>
              </div>
              {/* Clear + Close */}
              <button
                onClick={() =>
                  setMessages([
                    {
                      id: 'welcome',
                      role: 'model',
                      text: `Xin chào${user ? ' ' + user.email.split('@')[0] : ''}! 👋 Cuộc trò chuyện mới bắt đầu rồi. Mình có thể giúp gì cho bạn? 🚀`,
                      timestamp: new Date(),
                    },
                  ])
                }
                title="Xoá lịch sử"
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  borderRadius: 8,
                  color: 'rgba(255,255,255,0.8)',
                  cursor: 'pointer',
                  fontSize: 11,
                  padding: '4px 8px',
                  transition: 'background 0.2s',
                }}
              >
                🗑️
              </button>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  borderRadius: 8,
                  color: 'rgba(255,255,255,0.8)',
                  cursor: 'pointer',
                  fontSize: 16,
                  padding: '4px 8px',
                  lineHeight: 1,
                  transition: 'background 0.2s',
                }}
              >
                ✕
              </button>
            </div>

            {/* Messages */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px 14px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}
              {loading && (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 8 }}>
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      color: 'white',
                    }}
                  >
                    <BotIcon size={18} />
                  </div>
                  <div
                    style={{
                      background: 'rgba(255,255,255,0.85)',
                      borderRadius: '18px 18px 18px 4px',
                      padding: '6px 14px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    }}
                  >
                    <TypingDots />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick suggestions */}
            {messages.length <= 1 && (
              <div style={{ padding: '0 14px 10px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['Giúp tôi viết proposal 📝', 'Mức giá bid hợp lý? 💰', 'Tips nổi bật CV 🌟'].map(
                  (s) => (
                    <button
                      key={s}
                      onClick={() => setInput(s)}
                      style={{
                        background: 'rgba(37,99,235,0.08)',
                        border: '1px solid rgba(37,99,235,0.2)',
                        borderRadius: 20,
                        color: '#2563eb',
                        fontSize: 11.5,
                        padding: '5px 11px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontWeight: 500,
                      }}
                    >
                      {s}
                    </button>
                  ),
                )}
              </div>
            )}

            {/* Input area */}
            <div
              style={{
                padding: '10px 12px 12px',
                borderTop: '1px solid rgba(148,163,184,0.2)',
                background: 'rgba(255,255,255,0.6)',
                display: 'flex',
                gap: 8,
                alignItems: 'flex-end',
              }}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập tin nhắn... (Enter để gửi)"
                rows={1}
                style={{
                  flex: 1,
                  border: '1.5px solid rgba(148,163,184,0.35)',
                  borderRadius: 14,
                  padding: '9px 14px',
                  fontSize: 13.5,
                  outline: 'none',
                  resize: 'none',
                  background: 'white',
                  color: '#1e293b',
                  lineHeight: 1.5,
                  maxHeight: 90,
                  overflowY: 'auto',
                  transition: 'border-color 0.2s',
                  fontFamily: 'inherit',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(148,163,184,0.35)')}
              />
              <button
                className="chat-send-btn"
                onClick={handleSend}
                disabled={!input.trim() || loading}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background:
                    !input.trim() || loading
                      ? '#cbd5e1'
                      : 'linear-gradient(135deg, #2563eb, #3b82f6)',
                  border: 'none',
                  cursor: !input.trim() || loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  flexShrink: 0,
                  transition: 'all 0.2s',
                  boxShadow: !input.trim() || loading ? 'none' : '0 3px 10px rgba(37,99,235,0.4)',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M22 2L11 13"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M22 2L15 22L11 13L2 9L22 2Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ── Toggle Button ── */}
        <button
          className="chat-toggle-btn"
          onClick={() => setOpen((v) => !v)}
          title="BidWise AI Assistant"
          style={{
            width: 58,
            height: 58,
            borderRadius: '50%',
            background: open
              ? 'linear-gradient(135deg, #1e3251, #374151)'
              : 'linear-gradient(135deg, #1e3251 0%, #2563eb 100%)',
            border: '3px solid rgba(255,255,255,0.9)',
            boxShadow: pulse
              ? '0 4px 20px rgba(37,99,235,0.5)'
              : '0 4px 20px rgba(37,99,235,0.35)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
            animation: pulse ? 'chatPulse 2s ease-in-out infinite' : 'none',
            position: 'relative',
          }}
        >
          {open ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <BotIcon size={30} />
          )}
          {/* Unread badge — shown only before first open */}
          {pulse && (
            <span
              style={{
                position: 'absolute',
                top: -2,
                right: -2,
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: '#ef4444',
                border: '2px solid white',
                fontSize: 9,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
              }}
            >
              1
            </span>
          )}
        </button>
      </div>
    </>
  );
}
