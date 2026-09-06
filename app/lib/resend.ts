const RESEND_API_URL = 'https://api.resend.com/emails';

export interface ResendAttachment {
  filename: string;
  /** Base64-encoded file contents. */
  content: string;
}

export function textAttachment(filename: string, content: string): ResendAttachment {
  return {
    filename,
    content: Buffer.from(content, 'utf8').toString('base64'),
  };
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  attachments?: ResendAttachment[];
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  replyTo,
  attachments,
}: SendEmailOptions): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured');
  }

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || 'HelixCard <hello@mail.helixcard.app>',
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
      reply_to: replyTo || process.env.RESEND_REPLY_TO_EMAIL || 'hello@helixcard.app',
      ...(attachments ? { attachments } : {}),
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Resend request failed (${response.status}): ${details}`);
  }
}
