import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { readFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend;
  private from: string;

  constructor(private configService: ConfigService) {
    this.resend = new Resend(this.configService.get<string>('mail.resendApiKey'));
    this.from = this.configService.get<string>('mail.from') ?? 'BidWise <onboarding@resend.dev>';
  }

  private loadTemplate(name: string, vars: Record<string, string>): string {
    const isProd = process.env.NODE_ENV === 'production';
    const templatePath = isProd
      ? join(__dirname, 'templates', `${name}.html`)
      : join(process.cwd(), 'src', 'modules', 'email', 'templates', `${name}.html`);
    let html = readFileSync(templatePath, 'utf8');
    for (const [key, value] of Object.entries(vars)) {
      html = html.replaceAll(`{{${key}}}`, value);
    }
    return html;
  }

  async sendOtpVerification(to: string, fullName: string, otp: string): Promise<void> {
    const html = this.loadTemplate('otp-verification', { fullName, otp });
    await this.send(to, 'Mã xác thực email BidWise', html);
  }

  async sendPasswordReset(to: string, fullName: string, resetUrl: string): Promise<void> {
    const html = this.loadTemplate('password-reset', { fullName, resetUrl });
    await this.send(to, 'Đặt lại mật khẩu BidWise', html);
  }

  async sendAccountSuspended(to: string, fullName: string, reason: string): Promise<void> {
    const html = this.loadTemplate('account-suspended', { fullName, reason });
    await this.send(to, 'Tài khoản BidWise của bạn đã bị tạm khóa', html);
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    const { data, error } = await this.resend.emails.send({
      from: this.from,
      to,
      subject,
      html,
    });

    if (error) {
      this.logger.error(`Failed to send email to ${to}: ${JSON.stringify(error)}`);
      throw new Error(`Email send failed: ${error.message}`);
    }

    this.logger.log(`Email sent to ${to} — id: ${data?.id}`);
  }
}
