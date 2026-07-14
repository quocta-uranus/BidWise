import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import { ChatHistoryItem } from './dto/chat-message.dto';

@Injectable()
export class AiChatService {
  private readonly logger = new Logger(AiChatService.name);
  private readonly groq: Groq;

  constructor(private readonly configService: ConfigService) {
    this.groq = new Groq({
      apiKey: this.configService.get<string>('GROQ_API_KEY') ?? '',
    });
  }

  async chat(
    message: string,
    userRoles: string[],
    userName: string,
    history: ChatHistoryItem[] = [],
  ): Promise<string> {
    try {
      const systemPrompt = this.buildSystemPrompt(userRoles, userName);

      const messages: Groq.Chat.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        ...history.map((h) => ({
          role: h.role === 'model' ? ('assistant' as const) : ('user' as const),
          content: h.text,
        })),
        { role: 'user', content: message },
      ];

      const completion = await this.groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.7,
        max_tokens: 1024,
      });

      return completion.choices[0]?.message?.content ?? 'Xin lỗi, mình không thể trả lời lúc này.';
    } catch (err) {
      this.logger.error('Groq API error', err);
      throw err;
    }
  }

  private buildSystemPrompt(roles: string[], name: string): string {
    const roleLabel = roles.includes('ADMIN')
      ? 'Admin'
      : roles.includes('CLIENT')
        ? 'Client (người thuê freelancer)'
        : roles.includes('FREELANCER')
          ? 'Freelancer (người làm việc tự do)'
          : 'User';

    const tips = roles.includes('FREELANCER')
      ? `- Giúp freelancer viết proposal/cover letter chuyên nghiệp
- Tư vấn mức giá bid hợp lý theo thị trường
- Gợi ý cách nổi bật hồ sơ, kỹ năng cần học
- Hướng dẫn sử dụng tính năng: tìm job, đặt bid, quản lý hợp đồng`
      : roles.includes('CLIENT')
        ? `- Giúp client viết mô tả job rõ ràng, thu hút ứng viên tốt
- Tư vấn mức ngân sách phù hợp theo loại dự án
- Hướng dẫn cách chọn freelancer, đánh giá proposal
- Hỗ trợ quản lý dự án, milestone, thanh toán trên BidWise`
        : `- Giải đáp thắc mắc về nền tảng BidWise
- Hướng dẫn đăng ký, xác thực tài khoản`;

    return `Bạn là BidWise AI Assistant 🤖 — trợ lý thông minh của nền tảng freelance BidWise.

Thông tin người dùng:
- Tên: ${name}
- Vai trò: ${roleLabel}

Nhiệm vụ của bạn:
${tips}

Quy tắc trả lời:
- Trả lời ngắn gọn, thân thiện, dễ hiểu (dùng emoji khi phù hợp)
- Phản hồi bằng ngôn ngữ người dùng đang dùng (Tiếng Việt hoặc English)
- Không bịa thông tin, nếu không biết hãy nói thật và gợi ý liên hệ support
- Không trả lời các chủ đề không liên quan đến công việc và BidWise platform`;
  }
}
