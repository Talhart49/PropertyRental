import nodemailer from "nodemailer";

let transporter = null;

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.APP_PASSWORD
    }
  });

  return transporter;
}

export async function sendVerificationEmail({ to, verificationUrl }) {
  const from = process.env.EMAIL;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <div style="height: 4px; background: linear-gradient(90deg, #0f766e, #2563eb, #c2410c); border-radius: 2px;" />

      <div style="padding: 32px 24px;">
        <p style="font-size: 11px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #0f766e;">
          Property Rental
        </p>
        <h1 style="font-size: 22px; font-weight: 700; color: #0c0a09;">
          Verify your email address
        </h1>
        <p style="font-size: 14px; line-height: 1.6; color: #57534e; margin-top: 8px;">
          Thanks for creating a Property Rental account! Please verify your email address
          by clicking the button below. This link expires in 24 hours.
        </p>

        <a
          href="${verificationUrl}"
          style="display: inline-block; margin-top: 20px; border-radius: 6px; background-color: #0f766e; padding: 12px 28px; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none;"
        >
          Verify email address
        </a>

        <p style="font-size: 13px; line-height: 1.5; color: #a8a29e; margin-top: 24px; border-top: 1px solid #e7e5e4; padding-top: 16px;">
          If you did not create an account, you can safely ignore this email.
          <br /><br />
          Property Rental
        </p>
      </div>
    </div>
  `;

  const info = await getTransporter().sendMail({
    from,
    to,
    subject: "Verify your Property Rental email address",
    html
  });

  console.log(`  ✉️  Verification email sent to ${to} (messageId: ${info.messageId})`);
}

export async function sendPasswordResetEmail({ to, resetUrl }) {
  const from = process.env.EMAIL;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <div style="height: 4px; background: linear-gradient(90deg, #0f766e, #2563eb, #c2410c); border-radius: 2px;" />

      <div style="padding: 32px 24px;">
        <p style="font-size: 11px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #0f766e;">
          Property Rental
        </p>
        <h1 style="font-size: 22px; font-weight: 700; color: #0c0a09;">
          Reset your password
        </h1>
        <p style="font-size: 14px; line-height: 1.6; color: #57534e; margin-top: 8px;">
          We received a request to reset the password for your Property Rental account.
          Click the button below to set a new password. This link expires in 1 hour.
        </p>

        <a
          href="${resetUrl}"
          style="display: inline-block; margin-top: 20px; border-radius: 6px; background-color: #0f766e; padding: 12px 28px; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none;"
        >
          Reset password
        </a>

        <p style="font-size: 13px; line-height: 1.5; color: #a8a29e; margin-top: 24px; border-top: 1px solid #e7e5e4; padding-top: 16px;">
          If you did not request a password reset, you can safely ignore this email.
          <br /><br />
          Property Rental
        </p>
      </div>
    </div>
  `;

  const info = await getTransporter().sendMail({
    from,
    to,
    subject: "Reset your Property Rental password",
    html
  });

  console.log(`  ✉️  Password reset email sent to ${to} (messageId: ${info.messageId})`);
}