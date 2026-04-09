const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  await transporter.sendMail({
    from: `"SkillSwap" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};

const sendVerificationEmail = (email, token) => {
  const url = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
  return sendEmail({
    to: email,
    subject: 'Verify your SkillSwap account',
    html: `<p>Click <a href="${url}">here</a> to verify your email. Link expires in 1 hour.</p>`,
  });
};

const sendPasswordResetEmail = (email, token) => {
  const url = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
  return sendEmail({
    to: email,
    subject: 'Reset your SkillSwap password',
    html: `<p>Click <a href="${url}">here</a> to reset your password. Link expires in 1 hour.</p>`,
  });
};

const sendBookingConfirmation = (email, booking) => {
  return sendEmail({
    to: email,
    subject: 'Booking Confirmed - SkillSwap',
    html: `<p>Your session has been confirmed for ${new Date(booking.scheduled_at).toLocaleString()}.</p>`,
  });
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendBookingConfirmation,
};
