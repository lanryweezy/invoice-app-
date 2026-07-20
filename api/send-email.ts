import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, subject, html, text } = req.body;

  if (!to || !subject || (!html && !text)) {
    return res.status(400).json({ error: 'Missing required fields: to, subject, and html or text' });
  }

  // Security Enhancement: Input length validation (DoS prevention)
  if (to.length > 255 || subject.length > 255) {
    return res.status(400).json({ error: 'Invalid input: "to" and "subject" fields must not exceed 255 characters' });
  }

  if ((text && text.length > 50000) || (html && html.length > 50000)) {
    return res.status(400).json({ error: 'Invalid input: Message body is too large (max 50,000 characters)' });
  }

  if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return res.status(500).json({ error: 'Server SMTP configuration is missing.' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
    });

    const fromName = process.env.SMTP_FROM_NAME || process.env.SMTP_USER;
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      text: text || undefined,
      html: html || undefined,
    });

    return res.status(200).json({
      success: true,
      messageId: info.messageId,
    });
  } catch (error: any) {
    console.error('SMTP send error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to send email',
      code: error.code,
    });
  }
}
