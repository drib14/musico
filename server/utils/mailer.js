const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendVerificationEmail = async (email, code, name) => {
  const mailOptions = {
    from: `"Musico Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify Your Musico Account',
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #0b0f19; color: #ffffff; padding: 40px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #1e293b;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #3b82f6; font-size: 32px; margin: 0; font-weight: bold; letter-spacing: 1px;">MUSICO</h1>
          <p style="color: #94a3b8; font-size: 14px;">Elevating Your Music Experience</p>
        </div>
        <div style="background-color: #111827; padding: 30px; border-radius: 8px; border: 1px solid #1f2937;">
          <h2 style="color: #ffffff; font-size: 20px; margin-top: 0; font-weight: 600;">Hello ${name},</h2>
          <p style="color: #d1d5db; font-size: 16px; line-height: 1.5; margin-bottom: 25px;">
            Thank you for registering at Musico. To activate your account and access custom uploads and playlists, please verify your email with the 6-digit confirmation code below:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 36px; font-weight: bold; color: #3b82f6; letter-spacing: 6px; background-color: #1f2937; padding: 12px 30px; border-radius: 6px; border: 1px solid #374151;">${code}</span>
          </div>
          <p style="color: #94a3b8; font-size: 14px; margin-top: 25px;">
            This verification code is valid for 15 minutes. If you did not request this code, please ignore this email.
          </p>
        </div>
        <div style="text-align: center; margin-top: 30px; color: #64748b; font-size: 12px;">
          &copy; 2026 Musico, Inc. All rights reserved.
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Verification email sent successfully');
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
};

const sendResetPasswordEmail = async (email, code, name) => {
  const mailOptions = {
    from: `"Musico Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Reset Your Musico Password',
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #0b0f19; color: #ffffff; padding: 40px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #1e293b;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #3b82f6; font-size: 32px; margin: 0; font-weight: bold; letter-spacing: 1px;">MUSICO</h1>
          <p style="color: #94a3b8; font-size: 14px;">Elevating Your Music Experience</p>
        </div>
        <div style="background-color: #111827; padding: 30px; border-radius: 8px; border: 1px solid #1f2937;">
          <h2 style="color: #ffffff; font-size: 20px; margin-top: 0; font-weight: 600;">Hello ${name},</h2>
          <p style="color: #d1d5db; font-size: 16px; line-height: 1.5; margin-bottom: 25px;">
            We received a request to reset your password for your Musico account. Please enter the 6-digit confirmation code on the verification screen to reset your password:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 36px; font-weight: bold; color: #3b82f6; letter-spacing: 6px; background-color: #1f2937; padding: 12px 30px; border-radius: 6px; border: 1px solid #374151;">${code}</span>
          </div>
          <p style="color: #94a3b8; font-size: 14px; margin-top: 25px;">
            This recovery code is valid for 15 minutes. If you did not request this reset, you can safely ignore this email.
          </p>
        </div>
        <div style="text-align: center; margin-top: 30px; color: #64748b; font-size: 12px;">
          &copy; 2026 Musico, Inc. All rights reserved.
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully');
  } catch (error) {
    console.error('Error sending reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

module.exports = {
  sendVerificationEmail,
  sendResetPasswordEmail,
};
