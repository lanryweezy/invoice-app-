import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, subject, html, text, smtp } = req.body;

  if (!to || !subject || (!html && !text)) {
    return res.status(400).json({ error: 'Missing required fields: to, subject, and html or text' });
  }

  if (!smtp || !smtp.host || !smtp.port || !smtp.user || !smtp.pass) {
    return res.status(400).json({ error: 'Missing SMTP configuration: host, port, user, pass required' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: Number(smtp.port),
      secure: Number(smtp.port) === 465,
      auth: {
        user: smtp.user,
        pass: smtp.pass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
    });

    const info = await transporter.sendMail({
      from: `"${smtp.fromName || smtp.user}" <${smtp.fromEmail || smtp.user}>`,
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
