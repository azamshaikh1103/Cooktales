import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../../../config/env.validation';
import { EmailUnsubscribeService } from './email-unsubscribe.service';

type DigestItem = {
  text: string;
  targetPath: string | null;
};

@Injectable()
export class AuthMailerService {
  constructor(
    private readonly config: ConfigService<AppConfig, true>,
    private readonly unsubscribe: EmailUnsubscribeService,
  ) {}

  buildVerificationCodeEmail(email: string, code: string) {
    return {
      to: email,
      subject: 'Your CookTale verification code',
      html: this.renderEmail({
        title: 'Verify your email',
        preview: 'Use this code to finish signing in to CookTale.',
        body: `
          <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#4b5563;">Use this code to finish signing in to CookTale.</p>
          <div style="margin:28px 0;padding:22px 24px;border-radius:18px;background:#f0faf6;border:1px solid #d5eee5;text-align:center;">
            <div style="font-size:36px;letter-spacing:10px;font-weight:800;color:#006C5E;">${code}</div>
          </div>
          <p style="margin:0;font-size:13px;line-height:1.6;color:#667085;">This code expires shortly. If you did not request it, you can ignore this email.</p>
        `,
      }),
    };
  }

  buildPasswordResetEmail(email: string, resetUrl: string) {
    return {
      to: email,
      subject: 'Reset your CookTale password',
      html: this.renderEmail({
        title: 'Reset your password',
        preview: 'Use this secure link to set a new CookTale password.',
        body: `
          <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#4b5563;">Use this secure link to set a new password for your CookTale account.</p>
          ${this.primaryButton(resetUrl, 'Reset password')}
          <p style="margin:0;font-size:13px;line-height:1.6;color:#667085;">This link expires shortly and can be used once. If you did not request it, you can ignore this email.</p>
        `,
      }),
    };
  }

  buildAdminMagicLinkEmail(email: string, loginUrl: string) {
    return {
      to: email,
      subject: 'Your secure CookTale admin link',
      html: this.renderEmail({
        title: 'Sign in to CookTale admin',
        preview: 'Use this secure, one-time link to open the admin workspace.',
        body: `
          <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#4b5563;">Use this secure link to open the CookTale admin workspace.</p>
          ${this.primaryButton(loginUrl, 'Open admin workspace')}
          <p style="margin:0;font-size:13px;line-height:1.6;color:#667085;">This link expires shortly and works once. If you did not request it, you can ignore this email.</p>
        `,
      }),
    };
  }

  buildNotificationDigestEmail(input: {
    recipientId: string;
    to: string;
    recipientName: string;
    items: DigestItem[];
    total: number;
  }) {
    const activity = input.items
      .map((item) => {
        const label = this.escapeHtml(item.text);
        const url = this.absoluteInternalUrl(item.targetPath);
        return url
          ? `<li style="margin:0 0 12px;"><a href="${this.escapeHtml(url)}" style="color:#006C5E;text-decoration:none;font-size:15px;line-height:1.5;">${label}</a></li>`
          : `<li style="margin:0 0 12px;font-size:15px;line-height:1.5;color:#4b5563;">${label}</li>`;
      })
      .join('');
    const remaining = input.total - input.items.length;

    return {
      to: input.to,
      subject: `Your CookTale activity: ${input.total} new update${input.total === 1 ? '' : 's'}`,
      html: this.renderEmail({
        title: 'Your kitchen activity',
        preview: `You have ${input.total} new update${input.total === 1 ? '' : 's'} on CookTale.`,
        emailReason: 'You received this because daily kitchen activity emails are enabled for your account.',
        unsubscribeUrl: this.unsubscribe.createDailyDigestUrl(input.recipientId),
        body: `
          <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#4b5563;">Hi ${this.escapeHtml(input.recipientName)}, here is what happened in your kitchen.</p>
          <ul style="margin:0;padding-left:20px;color:#4b5563;">${activity}</ul>
          ${remaining > 0 ? `<p style="margin:18px 0 0;font-size:13px;line-height:1.6;color:#667085;">And ${remaining} more update${remaining === 1 ? '' : 's'} in your notification center.</p>` : ''}
          ${this.primaryButton(this.absoluteInternalUrl('/notifications') || this.config.get('FRONTEND_URL', { infer: true }), 'View notifications')}
        `,
      }),
    };
  }

  async sendEmail(input: { to: string; subject: string; html: string }) {
    const apiKey = this.config.get('RESEND_API_KEY', { infer: true });

    if (!apiKey) {
      console.log(`[auth-email:dev] ${input.subject} -> ${input.to}`);
      return;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.config.get('EMAIL_FROM', { infer: true }),
        to: input.to,
        subject: input.subject,
        html: input.html,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to send auth email: ${errorText}`);
    }
  }

  private renderEmail(input: {
    title: string;
    preview: string;
    body: string;
    emailReason?: string;
    unsubscribeUrl?: string;
  }) {
    const frontendUrl = this.config.get('FRONTEND_URL', { infer: true });
    const privacyUrl = new URL('/privacy', frontendUrl).toString();
    const termsUrl = new URL('/terms', frontendUrl).toString();
    const settingsUrl = new URL('/notifications', frontendUrl).toString();
    return `
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${input.preview}</div>
      <div style="margin:0;padding:32px 16px;background:#f4f7f5;font-family:Arial,Helvetica,sans-serif;color:#111827;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;border-collapse:collapse;">
          <tr>
            <td style="padding:4px 0 22px;text-align:left;">
              <a href="${this.escapeHtml(frontendUrl)}" style="font-size:27px;line-height:1;color:#006C5E;font-weight:800;letter-spacing:0;text-decoration:none;">CookTale</a>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;border:1px solid #dce8e2;border-radius:8px;background:#ffffff;">
              <h1 style="margin:0 0 12px;font-size:26px;line-height:1.25;color:#101827;">${input.title}</h1>
              ${input.body}
            </td>
          </tr>
          <tr>
            <td style="padding:26px 8px 8px;font-size:12px;line-height:1.65;color:#667085;text-align:center;">
              <div style="border-top:1px solid #dce8e2;padding-top:20px;">
                <a href="https://facebook.com/cooktale.in" style="display:inline-block;margin:0 4px;padding:7px 9px;border-radius:999px;background:#e7f2ed;color:#006C5E;font-size:11px;font-weight:700;text-decoration:none;">f</a>
                <a href="https://instagram.com/cooktale.in" style="display:inline-block;margin:0 4px;padding:7px 8px;border-radius:999px;background:#e7f2ed;color:#006C5E;font-size:11px;font-weight:700;text-decoration:none;">IG</a>
                <a href="https://youtube.com/cooktale.in" style="display:inline-block;margin:0 4px;padding:7px 8px;border-radius:999px;background:#e7f2ed;color:#006C5E;font-size:11px;font-weight:700;text-decoration:none;">YT</a>
                <a href="https://x.com/cooktaleapp" style="display:inline-block;margin:0 4px;padding:7px 9px;border-radius:999px;background:#e7f2ed;color:#006C5E;font-size:11px;font-weight:700;text-decoration:none;">X</a>
                <p style="margin:18px 0 6px;">CookTale for iOS and Android is coming soon.</p>
                <p style="margin:0 0 8px;">${input.emailReason || 'This is an account security email.'}</p>
                <p style="margin:0;">&copy; ${new Date().getFullYear()} CookTale. <a href="${this.escapeHtml(privacyUrl)}" style="color:#006C5E;text-decoration:underline;">Privacy</a> &nbsp;|&nbsp; <a href="${this.escapeHtml(termsUrl)}" style="color:#006C5E;text-decoration:underline;">Terms</a>${input.unsubscribeUrl ? ` &nbsp;|&nbsp; <a href="${this.escapeHtml(input.unsubscribeUrl)}" style="color:#006C5E;text-decoration:underline;">Unsubscribe</a>` : ` &nbsp;|&nbsp; <a href="${this.escapeHtml(settingsUrl)}" style="color:#006C5E;text-decoration:underline;">Notification settings</a>`}</p>
              </div>
            </td>
          </tr>
        </table>
      </div>
    `;
  }

  private primaryButton(url: string, label: string) {
    return `<a href="${this.escapeHtml(url)}" style="display:inline-block;margin:22px 0 0;padding:13px 20px;border-radius:8px;background:#006C5E;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;line-height:1.2;">${this.escapeHtml(label)}</a>`;
  }

  private absoluteInternalUrl(path: string | null) {
    if (!path?.startsWith('/')) return null;
    return new URL(path, this.config.get('FRONTEND_URL', { infer: true })).toString();
  }

  private escapeHtml(value: string) {
    return value.replace(/[&<>'"]/g, (character) => {
      const entities: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;',
      };
      return entities[character];
    });
  }
}
