const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const sendVerificationEmail = async (email, code, name) => {
  const mailOptions = {
    from: `"Musico Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify Your Musico Account',
    html: `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #070a13; color: #ffffff; padding: 40px; max-width: 600px; margin: 0 auto; border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); width: 60px; height: 60px; border-radius: 50%; margin-bottom: 16px; line-height: 60px;">
            <img src="https://cdn-icons-png.flaticon.com/512/3220/3220736.png" style="width: 30px; vertical-align: middle; filter: brightness(0) invert(1);" alt="Musico Logo">
          </div>
          <h1 style="color: #ffffff; font-size: 32px; margin: 0; font-weight: 800; letter-spacing: 2px;">MUSICO</h1>
          <p style="color: #3b82f6; font-size: 14px; font-weight: 600; margin-top: 8px; text-transform: uppercase; letter-spacing: 1px;">Elevating Your Music Experience</p>
        </div>
        <div style="background-color: #121826; padding: 40px 30px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.05); box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <h2 style="color: #ffffff; font-size: 22px; margin-top: 0; font-weight: 700;">Welcome to Musico, ${name}!</h2>
          <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
            We're thrilled to have you join our platform. To fully activate your account and start uploading tracks or curating your ultimate playlists, please verify your email address using the code below.
          </p>
          <div style="text-align: center; margin: 35px 0;">
            <div style="display: inline-block; background-color: #1e293b; padding: 15px 40px; border-radius: 8px; border: 1px solid #334155; box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);">
              <span style="font-size: 42px; font-weight: 800; color: #3b82f6; letter-spacing: 8px;">${code}</span>
            </div>
          </div>
          <p style="color: #64748b; font-size: 14px; margin-top: 30px; text-align: center;">
            This verification code is securely generated and will expire in <strong>15 minutes</strong>. If you did not create an account, please disregard this email.
          </p>
          <div style="text-align: center; margin-top: 40px; padding-top: 30px; border-top: 1px solid rgba(255, 255, 255, 0.05);">
            <a href="${CLIENT_URL}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; text-decoration: none; border-radius: 30px; font-weight: 700; font-size: 15px; letter-spacing: 0.5px; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);">Open Musico App</a>
          </div>
        </div>
        <div style="text-align: center; margin-top: 30px; color: #475569; font-size: 12px; line-height: 1.5;">
          <p>Musico, Inc. &bull; Your Direct Audio Streaming Platform</p>
          <p>&copy; ${new Date().getFullYear()} Musico. All rights reserved.</p>
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
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #070a13; color: #ffffff; padding: 40px; max-width: 600px; margin: 0 auto; border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); width: 60px; height: 60px; border-radius: 50%; margin-bottom: 16px; line-height: 60px;">
            <img src="https://cdn-icons-png.flaticon.com/512/3220/3220736.png" style="width: 30px; vertical-align: middle; filter: brightness(0) invert(1);" alt="Musico Logo">
          </div>
          <h1 style="color: #ffffff; font-size: 32px; margin: 0; font-weight: 800; letter-spacing: 2px;">MUSICO</h1>
          <p style="color: #3b82f6; font-size: 14px; font-weight: 600; margin-top: 8px; text-transform: uppercase; letter-spacing: 1px;">Elevating Your Music Experience</p>
        </div>
        <div style="background-color: #121826; padding: 40px 30px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.05); box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <h2 style="color: #ffffff; font-size: 22px; margin-top: 0; font-weight: 700;">Password Reset Request</h2>
          <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
            Hello ${name},<br><br>We received a request to reset the password for your Musico account. Please enter the 6-digit confirmation code below on the verification screen to proceed:
          </p>
          <div style="text-align: center; margin: 35px 0;">
            <div style="display: inline-block; background-color: #1e293b; padding: 15px 40px; border-radius: 8px; border: 1px solid #334155; box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);">
              <span style="font-size: 42px; font-weight: 800; color: #3b82f6; letter-spacing: 8px;">${code}</span>
            </div>
          </div>
          <p style="color: #64748b; font-size: 14px; margin-top: 30px; text-align: center;">
            This recovery code is securely generated and will expire in <strong>15 minutes</strong>. If you did not request a password reset, please safely ignore this email. Your account is secure.
          </p>
          <div style="text-align: center; margin-top: 40px; padding-top: 30px; border-top: 1px solid rgba(255, 255, 255, 0.05);">
            <a href="${CLIENT_URL}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; text-decoration: none; border-radius: 30px; font-weight: 700; font-size: 15px; letter-spacing: 0.5px; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);">Return to Musico</a>
          </div>
        </div>
        <div style="text-align: center; margin-top: 30px; color: #475569; font-size: 12px; line-height: 1.5;">
          <p>Musico, Inc. &bull; Your Direct Audio Streaming Platform</p>
          <p>&copy; ${new Date().getFullYear()} Musico. All rights reserved.</p>
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
