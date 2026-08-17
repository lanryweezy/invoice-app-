import type { VercelRequest, VercelResponse } from "@vercel/node";
import nodemailer from "nodemailer";
import * as admin from "firebase-admin";

const MAX_SUBJECT_LENGTH = 255;
const MAX_BODY_LENGTH = 50_000;
const MAX_RECIPIENTS = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 50;

if (!admin.apps.length) {
  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccount) {
      admin.initializeApp({ credential: admin.credential.cert(JSON.parse(serviceAccount)) });
    } else {
      admin.initializeApp({ credential: admin.credential.applicationDefault() });
    }
  } catch (error) {
    console.error("Failed to initialize Firebase Admin", error);
  }
}

const getString = (value: unknown): string => typeof value === "string" ? value.trim() : "";

const isValidEmail = (value: string): boolean =>
  /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value);

const parseRecipients = (value: unknown): string[] =>
  getString(value)
    .split(/[;,]/)
    .map((email) => email.trim())
    .filter(Boolean);

// Keep the supported formatting tags while removing executable markup and dangerous URLs.
const sanitizeHtml = (value: string): string => value
  .replace(/<!--[\s\S]*?-->/g, "")
  .replace(/<\s*(script|style|iframe|object|embed|form|input|button|textarea|select|meta|link)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
  .replace(/<\s*(script|style|iframe|object|embed|form|input|button|textarea|select|meta|link)\b[^>]*\/?>/gi, "")
  .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
  .replace(/\s+(?:href|src|action| formaction)\s*=\s*(?:"\s*javascript:[^"]*"|'\s*javascript:[^']*'|\s*javascript:[^\s>]+)/gi, "")
  .replace(/javascript\s*:/gi, "");

const consumeRateLimit = async (uid: string): Promise<boolean> => {
  const db = admin.firestore();
  const ref = db.collection("emailRateLimits").doc(uid);
  const now = Date.now();

  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const current = snapshot.exists ? snapshot.data() : undefined;
    const windowStart = Number(current?.windowStart || 0);
    const count = Number(current?.count || 0);
    const withinWindow = now - windowStart < RATE_LIMIT_WINDOW_MS;

    if (withinWindow && count >= RATE_LIMIT_MAX) return false;

    transaction.set(ref, {
      windowStart: withinWindow ? windowStart : now,
      count: withinWindow ? count + 1 : 1,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    return true;
  });
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing or invalid token" });
  }

  const token = authHeader.slice("Bearer ".length).trim();
  let uid: string;
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    uid = decoded.uid;
  } catch (error) {
    console.error("Token verification failed", error);
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }

  try {
    const userSnapshot = await admin.firestore().collection("users").doc(uid).get();
    if (!userSnapshot.exists || userSnapshot.data()?.plan !== "pro") {
      return res.status(403).json({ error: "A Pro plan is required to send email" });
    }

    if (!(await consumeRateLimit(uid))) {
      return res.status(429).json({ error: "Email send limit reached. Try again later." });
    }
  } catch (error) {
    console.error("Email authorization/rate-limit check failed", { uid, error });
    return res.status(503).json({ error: "Email service is temporarily unavailable" });
  }

  const body = req.body && typeof req.body === "object" ? req.body : {};
  const recipients = parseRecipients(body.to);
  const subject = getString(body.subject);
  const html = getString(body.html);
  const text = getString(body.text);

  if (!recipients.length || !subject || (!html && !text)) {
    return res.status(400).json({ error: "Missing required fields: to, subject, and html or text" });
  }
  if (recipients.length > MAX_RECIPIENTS || recipients.some((email) => email.length > 254 || !isValidEmail(email))) {
    return res.status(400).json({ error: "Invalid recipient address" });
  }
  if (subject.length > MAX_SUBJECT_LENGTH) {
    return res.status(400).json({ error: "Subject must not exceed 255 characters" });
  }
  if (html.length > MAX_BODY_LENGTH || text.length > MAX_BODY_LENGTH) {
    return res.status(400).json({ error: "Message body is too large (max 50,000 characters)" });
  }

  if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return res.status(500).json({ error: "Server SMTP configuration is missing." });
  }

  try {
    const smtpPort = Number(process.env.SMTP_PORT);
    if (!Number.isInteger(smtpPort) || smtpPort < 1 || smtpPort > 65535) {
      return res.status(500).json({ error: "Server SMTP configuration is invalid." });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
    });

    const fromName = process.env.SMTP_FROM_NAME || process.env.SMTP_USER;
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
    const info = await transporter.sendMail({
      from: `"${fromName.replace(/[\r\n"]/g, "")}" <${fromEmail}>`,
      to: recipients.join(", "),
      subject,
      text: text || undefined,
      html: html ? sanitizeHtml(html) : undefined,
    });

    return res.status(200).json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error("SMTP send error", { uid, error });
    return res.status(500).json({ error: "Failed to send email" });
  }
}
