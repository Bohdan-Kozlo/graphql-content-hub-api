import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class PasswordRecoveryMailer {
  private readonly from: string;
  private readonly appUrl: string;
  private readonly transporter: Transporter;

  constructor(config: ConfigService) {
    const host = config.get<string>('MAIL_HOST') ?? '127.0.0.1';
    const port = Number(config.get<string>('MAIL_PORT') ?? 1025);
    const user = config.get<string>('MAIL_USER');
    const pass = config.get<string>('MAIL_PASSWORD');
    this.from = config.get<string>('MAIL_FROM') ?? 'Content Hub <no-reply@content-hub.local>';
    this.appUrl = config.get<string>('APP_PUBLIC_URL') ?? 'http://localhost:5173';
    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: config.get<string>('MAIL_SECURE') === 'true',
      ...(user && pass ? { auth: { user, pass } } : {}),
    });
  }

  async sendResetLink(email: string, token: string): Promise<void> {
    const url = new URL('/reset-password', this.appUrl);
    url.searchParams.set('token', token);
    await this.send(
      email,
      'Reset your Content Hub password',
      `Use this link to reset your Content Hub password within 30 minutes:\n\n${url.toString()}\n\nIf you did not request this, you can ignore this email.`,
    );
  }

  async sendChangedNotice(email: string): Promise<void> {
    await this.send(
      email,
      'Your Content Hub password was changed',
      'Your Content Hub password was changed. If you did not do this, contact the site administrator.',
    );
  }

  private async send(to: string, subject: string, text: string): Promise<void> {
    const result = await this.transporter.sendMail({ from: this.from, to, subject, text });
    if (!result.accepted?.includes(to)) throw new Error('SMTP did not accept the recipient');
  }
}
