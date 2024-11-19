import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.error('Missing email configuration:', {
        hasGmailUser: !!process.env.GMAIL_USER,
        hasGmailPassword: !!process.env.GMAIL_APP_PASSWORD
      });
      return NextResponse.json(
        { error: 'Email service not configured properly' },
        { status: 500 }
      );
    }

    const { email, cardUrl, cardOwner, ownerEmail, note } = await request.json();
    
    console.log('Attempting to send email with config:', {
      to: email,
      from: process.env.GMAIL_USER,
      hasPassword: !!process.env.GMAIL_APP_PASSWORD,
      cardOwner,
      hasOwnerEmail: !!ownerEmail
    });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const mailOptions = {
      from: {
        name: 'HelixCard',
        address: process.env.GMAIL_USER
      },
      ...(ownerEmail && { replyTo: ownerEmail }),
      to: email,
      subject: `Here is ${cardOwner}'s business card`,
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb;">
          <h1 style="font-size: 24px; font-weight: 600; margin-bottom: 16px; color: #111827;">Here is ${cardOwner}'s business card</h1>
          
          ${note ? `
            <p style="font-size: 16px; color: #374151; margin-bottom: 8px;"><strong>Note:</strong></p>
            <p style="font-size: 16px; color: #374151; margin-bottom: 24px;">${note}</p>
          ` : ''}
          
          <a href="${cardUrl}" style="display: inline-block; background-color: #18181B; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 24px; font-weight: 500; margin: 16px 0;">View Business Card</a>
          
          ${ownerEmail 
            ? `<p style="font-size: 14px; color: #4B5563; margin-top: 24px;">You can reply directly to this email to contact ${cardOwner}.</p>`
            : ''
          }
          
          <p style="font-size: 14px; color: #4B5563; margin-top: 24px;">Hope you have a great day!</p>
          
          <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 14px; color: #4B5563; margin: 0;">Best regards,</p>
            <p style="font-size: 14px; font-weight: 500; color: #111827; margin: 4px 0;">HelixCard Team</p>
          </div>
          
          <p style="font-size: 13px; color: #6B7280; margin-top: 24px;">
            P.S. Want your own digital business card? Create one for free at <a href="https://helixcard.app" style="color: #2563EB; text-decoration: none;">helixcard.app</a>
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Detailed error in email sending:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}
