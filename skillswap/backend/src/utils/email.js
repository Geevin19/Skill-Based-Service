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

const baseTemplate = (content) => `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;padding:20px;border-radius:12px;">
    <div style="background:#2563eb;padding:20px;border-radius:8px 8px 0 0;text-align:center;">
      <h1 style="color:white;margin:0;font-size:24px;">SkillSwap</h1>
      <p style="color:#bfdbfe;margin:4px 0 0;">Peer-to-Peer Skill Learning</p>
    </div>
    <div style="background:white;padding:30px;border-radius:0 0 8px 8px;border:1px solid #e5e7eb;">
      ${content}
    </div>
    <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:16px;">
      © ${new Date().getFullYear()} SkillSwap. All rights reserved.
    </p>
  </div>
`;

// Welcome email after signup
const sendWelcomeEmail = (email, name) => sendEmail({
  to: email,
  subject: 'Welcome to SkillSwap! 🎉',
  html: baseTemplate(`
    <h2 style="color:#1f2937;">Welcome, ${name}! 👋</h2>
    <p style="color:#4b5563;">Your account has been created successfully. You're now part of the SkillSwap community.</p>
    <div style="background:#eff6ff;padding:16px;border-radius:8px;margin:20px 0;">
      <p style="color:#1d4ed8;margin:0;font-weight:bold;">What you can do:</p>
      <ul style="color:#3b82f6;margin:8px 0 0;">
        <li>Browse and book sessions from expert mentors</li>
        <li>Chat with mentors in real-time</li>
        <li>Join live video sessions</li>
        <li>Switch to mentor role and start teaching</li>
      </ul>
    </div>
    <a href="${process.env.CLIENT_URL}/mentors" style="display:inline-block;background:#2563eb;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
      Find a Mentor
    </a>
  `),
});

// Password reset email
const sendPasswordResetEmail = (email, token) => {
  const url = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
  return sendEmail({
    to: email,
    subject: 'Reset your SkillSwap password 🔐',
    html: baseTemplate(`
      <h2 style="color:#1f2937;">Password Reset Request</h2>
      <p style="color:#4b5563;">We received a request to reset your password. Click the button below to set a new password.</p>
      <a href="${url}" style="display:inline-block;background:#2563eb;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">
        Reset Password
      </a>
      <p style="color:#9ca3af;font-size:13px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
    `),
  });
};

// Booking confirmation to learner
const sendBookingConfirmation = (email, booking) => sendEmail({
  to: email,
  subject: 'Booking Confirmed ✅ - SkillSwap',
  html: baseTemplate(`
    <h2 style="color:#1f2937;">Your Booking is Confirmed!</h2>
    <div style="background:#f0fdf4;border:1px solid #86efac;padding:16px;border-radius:8px;margin:16px 0;">
      <p style="color:#166534;margin:0;font-weight:bold;">Session Details</p>
      <p style="color:#15803d;margin:8px 0 0;">📅 Date: ${new Date(booking.scheduled_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
      <p style="color:#15803d;margin:4px 0;">⏱ Duration: ${booking.duration_minutes} minutes</p>
      <p style="color:#15803d;margin:4px 0;">💰 Amount: ₹${(booking.price * 83).toFixed(0)}</p>
      ${booking.meeting_link ? `<p style="color:#15803d;margin:4px 0;">🔗 Meeting: <a href="${booking.meeting_link}" style="color:#2563eb;">${booking.meeting_link}</a></p>` : ''}
    </div>
    ${booking.meeting_link ? `
    <a href="${booking.meeting_link}" style="display:inline-block;background:#16a34a;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-bottom:12px;">
      Join Google Meet
    </a><br/>` : ''}
    <a href="${process.env.CLIENT_URL}/bookings" style="display:inline-block;background:#2563eb;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
      View Booking
    </a>
  `),
});

// New booking notification to mentor
const sendNewBookingToMentor = (email, booking, learnerName) => sendEmail({
  to: email,
  subject: 'New Booking Request 📬 - SkillSwap',
  html: baseTemplate(`
    <h2 style="color:#1f2937;">You have a new booking request!</h2>
    <p style="color:#4b5563;"><strong>${learnerName}</strong> wants to book a session with you.</p>
    <div style="background:#eff6ff;border:1px solid #93c5fd;padding:16px;border-radius:8px;margin:16px 0;">
      <p style="color:#1d4ed8;margin:0;">📅 Requested: ${new Date(booking.scheduled_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
      <p style="color:#1d4ed8;margin:4px 0;">⏱ Duration: ${booking.duration_minutes} minutes</p>
      <p style="color:#1d4ed8;margin:4px 0;">💰 Earnings: ₹${(booking.price * 83 * 0.9).toFixed(0)}</p>
    </div>
    <a href="${process.env.CLIENT_URL}/mentor/dashboard" style="display:inline-block;background:#2563eb;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
      View Dashboard
    </a>
  `),
});

// Booking cancelled
const sendBookingCancelled = (email, booking) => sendEmail({
  to: email,
  subject: 'Booking Cancelled - SkillSwap',
  html: baseTemplate(`
    <h2 style="color:#1f2937;">Booking Cancelled</h2>
    <p style="color:#4b5563;">Your booking scheduled for <strong>${new Date(booking.scheduled_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</strong> has been cancelled.</p>
    ${booking.cancel_reason ? `<p style="color:#6b7280;">Reason: ${booking.cancel_reason}</p>` : ''}
    <a href="${process.env.CLIENT_URL}/sessions" style="display:inline-block;background:#2563eb;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px;">
      Browse Sessions
    </a>
  `),
});

// Admin notification for new user signup
const sendAdminNewUser = (name, email, role) => sendEmail({
  to: process.env.ADMIN_EMAIL,
  subject: `New ${role} registered - SkillSwap`,
  html: baseTemplate(`
    <h2 style="color:#1f2937;">New User Registered</h2>
    <div style="background:#f9fafb;padding:16px;border-radius:8px;margin:16px 0;">
      <p style="color:#374151;margin:0;"><strong>Name:</strong> ${name}</p>
      <p style="color:#374151;margin:4px 0;"><strong>Email:</strong> ${email}</p>
      <p style="color:#374151;margin:4px 0;"><strong>Role:</strong> <span style="text-transform:capitalize;">${role}</span></p>
      <p style="color:#374151;margin:4px 0;"><strong>Time:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
    </div>
    <a href="${process.env.CLIENT_URL}/admin" style="display:inline-block;background:#2563eb;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
      View Admin Panel
    </a>
  `),
});

// Admin notification for new booking
const sendAdminNewBooking = (booking) => sendEmail({
  to: process.env.ADMIN_EMAIL,
  subject: 'New Booking Created - SkillSwap',
  html: baseTemplate(`
    <h2 style="color:#1f2937;">New Booking Created</h2>
    <div style="background:#f9fafb;padding:16px;border-radius:8px;margin:16px 0;">
      <p style="color:#374151;margin:0;"><strong>Booking ID:</strong> ${booking.id}</p>
      <p style="color:#374151;margin:4px 0;"><strong>Amount:</strong> ₹${(booking.price * 83).toFixed(0)}</p>
      <p style="color:#374151;margin:4px 0;"><strong>Scheduled:</strong> ${new Date(booking.scheduled_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
    </div>
    <a href="${process.env.CLIENT_URL}/admin" style="display:inline-block;background:#2563eb;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
      View Admin Panel
    </a>
  `),
});

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendBookingConfirmation,
  sendNewBookingToMentor,
  sendBookingCancelled,
  sendAdminNewUser,
  sendAdminNewBooking,
};
