import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { otpStore } from '@/lib/auth/otp-store';

export async function POST(req: Request) {
  let email = '';
  try {
    const body = await req.json();
    email = String(body?.email ?? '').trim().toLowerCase();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body.' }, { status: 400 });
  }
  if (!email) {
    return NextResponse.json({ success: false, message: 'Email is required.' }, { status: 400 });
  }

  // 1. Generate secure random 6-digit OTP
  const code = String(Math.floor(100000 + Math.random() * 900000));
  otpStore.set(email, {
    code,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 mins
  });

  // 2. Send Real Email via Gmail SMTP
  // Credentials come from the environment only. A committed fallback is a
  // published credential.
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (!smtpUser || !smtpPass) {
    console.error('[Storefront Email OTP] SMTP_USER/SMTP_PASS are not configured.');
    return NextResponse.json(
      { success: false, message: 'Email sign-in is unavailable right now.' },
      { status: 503 },
    );
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await transporter.sendMail({
      from: `"Anuprerna" <${smtpUser}>`,
      to: email,
      subject: `${code} is your Anuprerna verification code`,
      text: `Your Anuprerna sign-in verification code is: ${code}. It expires in 10 minutes.`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 520px; margin: 0 auto; padding: 28px; background-color: #FAF9F7; border: 1px solid #E8E4DE; border-radius: 12px; color: #1A1714;">
          <div style="margin-bottom: 24px;">
            <h1 style="font-family: serif; font-size: 26px; font-weight: 600; color: #7D5B20; margin: 0;">Anuprerna</h1>
            <p style="font-size: 13px; color: #847D77; margin-top: 4px;">Artisan Alliance & Sustainable Handlooms</p>
          </div>
          <div style="background: #ffffff; padding: 24px; border-radius: 8px; border: 1px solid #E8E4DE; text-align: center;">
            <p style="font-size: 15px; color: #4A4540; margin-bottom: 12px;">Your 6-digit sign-in verification code is:</p>
            <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #7D5B20; padding: 12px 0; font-family: monospace;">
              ${code}
            </div>
            <p style="font-size: 13px; color: #847D77; margin-top: 12px;">This code will expire in <strong>10 minutes</strong>.</p>
          </div>
          <p style="font-size: 12px; color: #AAA39E; margin-top: 20px; text-align: center;">
            If you did not request this code, please safely ignore this email.
          </p>
        </div>
      `,
    });

  } catch (err) {
    console.error('[Storefront Email OTP] Failed to send the sign-in code:', err);
    return NextResponse.json(
      { success: false, message: 'Could not send the sign-in code. Please try again.' },
      { status: 502 },
    );
  }

  return NextResponse.json({
    success: true,
    message: `We've sent a 6-digit code to ${email}`,
  });
}
