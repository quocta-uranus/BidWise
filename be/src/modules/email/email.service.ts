import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { readFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('mail.host'),
      port: this.configService.get<number>('mail.port'),
      secure: false,
      auth: {
        user: this.configService.get<string>('mail.user'),
        pass: this.configService.get<string>('mail.pass'),
      },
    });
  }

  private loadTemplate(name: string, vars: Record<string, string>): string {
    // In production (dist/), templates are copied next to the compiled JS
    // In dev (src/), templates are in src/modules/email/templates/
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
    const info = await this.transporter.sendMail({
      from: this.configService.get<string>('mail.from'),
      to,
      subject,
      html,
    });
    this.logger.log(`Email sent to ${to} — messageId: ${info.messageId}`);
  }
}
