import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD || !process.env.EMAIL_SENDER) {
      console.error('Missing email configuration');
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    const { email, cardUrl, cardOwner, ownerEmail } = await request.json();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER, // Your main Gmail address
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const mailOptions = {
      from: {
        name: 'HelixCard',
        address: process.env.EMAIL_SENDER // Your alias email
      },
      ...(ownerEmail && { replyTo: ownerEmail }),
      to: email,
      subject: `${cardOwner}'s Digital Business Card`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Digital Business Card Shared with You</h2>
          <p>Hello,</p>
          <p>${cardOwner} has shared their digital business card with you.</p>
          <p>Click the link below to view the card:</p>
          <p><a href="${cardUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">View Business Card</a></p>
          <p>Or copy this URL:</p>
          <p>${cardUrl}</p>
          ${ownerEmail 
            ? `<p>You can reply directly to this email to contact ${cardOwner}.</p>`
            : ''
          }
          <p>Best regards,<br>HelixCard Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json(
      { error: `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
