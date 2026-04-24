import nodemailer from 'nodemailer';
import logger from '../utils/logger';

/**
 * §6.4 and §4.10 Transactional Email Service
 * Supports Nodemailer + generic SMTP or dedicated providers like Resend.
 */
class EmailService {
  private transporter: nodemailer.Transporter;
  private isConfigured: boolean = false;

  constructor() {
    const emailHost = process.env.EMAIL_HOST;
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (emailHost && emailUser && emailPass && /*  */
        emailHost !== 'smtp.example.com' && 
        emailUser !== '' && 
        emailPass !== '') {
      this.transporter = nodemailer.createTransport({
        host: emailHost,
        port: Number(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: emailUser,
          pass: emailPass,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });
      this.isConfigured = true;
      logger.info('✅ Email service initialized');
    } else {
      // Fallback to console logging for development
      this.transporter = nodemailer.createTransport({
        streamTransport: true,
        newline: 'unix',
        buffer: true,
      });
      logger.warn('⚠️  Email not configured - emails will be logged to console');
    }
  }

  async sendMail(to: string, subject: string, html: string): Promise<boolean> {
    try {
      const from = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'Skemly <noreply@skemly.com>';
      const info = await this.transporter.sendMail({
        from,
        to,
        subject,
        html,
      });

      if (!this.isConfigured) {
        logger.info(`[EMAIL] (DEV) To: ${to}, From: ${from}, Subject: ${subject}`);
        logger.debug(`[EMAIL BODY] ${html}`);
      } else {
        logger.info(`✅ Email sent to ${to}: ${subject}`);
      }

      return true;
    } catch (err) {
      logger.error('❌ Failed to send email:', err);
      return false;
    }
  }

  // §4.1 AUTH-01/04 Email verification
  async sendVerificationEmail(to: string, token: string): Promise<boolean> {
    const link = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background-color: #f4f4f5; }
            .wrapper { width: 100%; table-layout: fixed; background-color: #f4f4f5; padding-bottom: 40px; padding-top: 40px; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 40px -10px rgba(0,0,0,0.1); }
            .header { background: #09090b; color: white; padding: 48px 40px; text-align: center; }
            .content { padding: 48px 40px; text-align: left; }
            .button { display: inline-block; background: #000000; color: #ffffff !important; padding: 16px 32px; text-decoration: none; border-radius: 14px; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin: 24px 0; }
            .footer { text-align: center; padding: 0 40px 40px; font-size: 12px; color: #71717a; }
            h1 { margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.02em; }
            p { margin: 0 0 16px; color: #4b5563; font-size: 16px; }
            .link-box { background: #f9fafb; border: 1px solid #e5e7eb; padding: 16px; border-radius: 12px; font-family: monospace; font-size: 12px; color: #09090b; word-break: break-all; margin-top: 24px; }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <h1>Verify your email</h1>
              </div>
              <div class="content">
                <p>Welcome to <strong>Skemly</strong>!</p>
                <p>To start creating professional diagrams with AI, please verify your email address by clicking the button below.</p>
                <div style="text-align: center;">
                  <a href="${link}" class="button">Verify Email Address</a>
                </div>
                <p>If the button doesn't work, copy and paste this link into your browser:</p>
                <div class="link-box">${link}</div>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Skemly. Premium Diagramming for Professionals.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
    return this.sendMail(to, 'Verify your email - Skemly', html);
  }

  // §4.1 AUTH-05 Password reset
  async sendPasswordResetEmail(to: string, token: string): Promise<boolean> {
    const link = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background-color: #f4f4f5; }
            .wrapper { width: 100%; table-layout: fixed; background-color: #f4f4f5; padding-bottom: 40px; padding-top: 40px; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 40px -10px rgba(0,0,0,0.1); }
            .header { background: #09090b; color: white; padding: 48px 40px; text-align: center; }
            .content { padding: 48px 40px; text-align: left; }
            .button { display: inline-block; background: #000000; color: #ffffff !important; padding: 16px 32px; text-decoration: none; border-radius: 14px; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin: 24px 0; }
            .footer { text-align: center; padding: 0 40px 40px; font-size: 12px; color: #71717a; }
            h1 { margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.02em; }
            p { margin: 0 0 16px; color: #4b5563; font-size: 16px; }
            .warning { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 12px; margin: 24px 0; color: #92400e; font-size: 14px; }
            .link-box { background: #f9fafb; border: 1px solid #e5e7eb; padding: 16px; border-radius: 12px; font-family: monospace; font-size: 12px; color: #09090b; word-break: break-all; }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <h1>Reset your password</h1>
              </div>
              <div class="content">
                <p>We received a request to reset the password for your <strong>Skemly</strong> account.</p>
                <div style="text-align: center;">
                  <a href="${link}" class="button">Reset Password</a>
                </div>
                <div class="warning">
                  <strong>Security Notice:</strong> This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.
                </div>
                <p>Or copy and paste this link:</p>
                <div class="link-box">${link}</div>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Skemly. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
    return this.sendMail(to, 'Reset your password - Skemly', html);
  }

  // §4.10 NOTIF-02 Workspace invitation
  async sendWorkspaceInvite(to: string, workspaceName: string, inviteToken: string, inviterName: string): Promise<boolean> {
    const link = `${process.env.FRONTEND_URL}/invite?token=${inviteToken}`;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background-color: #f4f4f5; }
            .wrapper { width: 100%; table-layout: fixed; background-color: #f4f4f5; padding-bottom: 40px; padding-top: 40px; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 40px -10px rgba(0,0,0,0.1); }
            .header { background: #09090b; color: white; padding: 48px 40px; text-align: center; }
            .content { padding: 48px 40px; text-align: left; }
            .workspace-card { background: #f9fafb; border: 2px solid #e5e7eb; padding: 24px; border-radius: 16px; margin: 24px 0; text-align: center; }
            .button { display: inline-block; background: #000000; color: #ffffff !important; padding: 16px 32px; text-decoration: none; border-radius: 14px; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin: 24px 0; }
            .footer { text-align: center; padding: 0 40px 40px; font-size: 12px; color: #71717a; }
            h1 { margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.02em; }
            h2 { margin: 0; color: #000000; font-size: 20px; font-weight: 800; }
            p { margin: 0 0 16px; color: #4b5563; font-size: 16px; }
            .inviter { color: #000000; font-weight: 700; }
            .link-box { background: #f9fafb; border: 1px solid #e5e7eb; padding: 16px; border-radius: 12px; font-family: monospace; font-size: 11px; color: #09090b; word-break: break-all; margin-top: 24px; }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <h1>You're Invited! 🎉</h1>
              </div>
              <div class="content">
                <p>Hi there,</p>
                <p><span class="inviter">${inviterName}</span> has invited you to collaborate on a workspace in <strong>Skemly</strong>:</p>
                
                <div class="workspace-card">
                  <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 800; color: #9ca3af; margin-bottom: 8px;">Workspace Name</p>
                  <h2>${workspaceName}</h2>
                </div>

                <p>Join the workspace to start creating and collaborating on diagrams together in real-time.</p>
                
                <div style="text-align: center;">
                  <a href="${link}" class="button">Accept Invitation</a>
                </div>

                <p>Or copy and paste this link into your browser:</p>
                <div class="link-box">${link}</div>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Skemly. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
    return this.sendMail(to, `Invite to join ${workspaceName} - Skemly`, html);
  }

  // §4.10 NOTIF-03 Digest notifications
  async sendDigestEmail(to: string, notifications: any[]): Promise<boolean> {
    const notificationItems = notifications.map(n => `
      <div style="background: white; border-left: 4px solid #09090b; padding: 12px; margin: 10px 0;">
        <strong>${n.title}</strong>
        <p style="margin: 5px 0; color: #6b7280;">${n.message}</p>
        <small style="color: #9ca3af;">${new Date(n.createdAt).toLocaleString()}</small>
      </div>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #09090b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #09090b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Your Skemly Updates</h1>
            </div>
            <div class="content">
              <p>Hi there,</p>
              <p>Here's what happened in your workspaces:</p>
              ${notificationItems}
              <p style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}/notifications" class="button">View All Notifications</a>
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Skemly. All rights reserved.</p>
              <p><a href="${process.env.FRONTEND_URL}/settings/notifications" style="color: #6b7280;">Manage notification preferences</a></p>
            </div>
          </div>
        </body>
      </html>
    `;
    return this.sendMail(to, `You have ${notifications.length} new updates - Skemly`, html);
  }
}

export const emailService = new EmailService();
