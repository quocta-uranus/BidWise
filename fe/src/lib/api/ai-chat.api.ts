import { apiClient } from './client';

export interface ChatHistoryItem {
  role: 'user' | 'model';
  text: string;
}

// TransformResponseInterceptor wraps as: { success, data: { reply }, timestamp }
interface BackendResponse {
  success: boolean;
  data: { reply: string };
  timestamp: string;
}

export async function sendChatMessage(
  message: string,
  history: ChatHistoryItem[] = [],
): Promise<string> {
  const { data } = await apiClient.post<BackendResponse>(
    '/ai-chat/message',
    { message, history },
    { timeout: 30000 }, // 30s timeout
  );
  return data.data.reply ?? 'Xin lỗi, mình không nhận được phản hồi.';
}
