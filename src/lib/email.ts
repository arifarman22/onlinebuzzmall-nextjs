import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendEmail(to: string, subject: string, html: string) {
  return transporter.sendMail({
    from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM}>`,
    to,
    subject,
    html,
  });
}

export async function sendOTPEmail(to: string, otp: string) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #6366f1;">OnlineBuzz Mall</h2>
      <p>Your verification code is:</p>
      <h1 style="color: #6366f1; letter-spacing: 4px;">${otp}</h1>
      <p>This code expires in 10 minutes.</p>
    </div>
  `;
  return sendEmail(to, 'Verification Code - OnlineBuzz Mall', html);
}
