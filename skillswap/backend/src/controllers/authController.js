const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { generateToken, generateShortToken, verifyToken } = require('../utils/jwt');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/email');

const signup = async (req, res) => {
  try {
    const { email, password, name, role = 'learner' } = req.body;

    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows[0]) return res.status(409).json({ message: 'Email already registered' });

    const hash = await bcrypt.hash(password, 12);
    const verificationToken = generateShortToken({ email, purpose: 'verify' });

    const userResult = await db.query(
      `INSERT INTO users (email, password_hash, role, verification_token)
       VALUES ($1, $2, $3, $4) RETURNING id, email, role`,
      [email, hash, role, verificationToken]
    );
    const user = userResult.rows[0];

    await db.query(
      `INSERT INTO profiles (user_id, name) VALUES ($1, $2)`,
      [user.id, name]
    );

    await sendVerificationEmail(email, verificationToken);

    res.status(201).json({ message: 'Account created. Please verify your email.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await db.query(
      'SELECT id, email, password_hash, role, is_verified, is_active FROM users WHERE email = $1',
      [email]
    );
    const user = result.rows[0];

    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    if (!user.is_active) return res.status(403).json({ message: 'Account suspended' });
    if (!user.is_verified) return res.status(403).json({ message: 'Please verify your email first' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    const token = generateToken(user.id, user.role);

    const profile = await db.query('SELECT * FROM profiles WHERE user_id = $1', [user.id]);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: profile.rows[0] || null,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    const decoded = verifyToken(token);

    const result = await db.query(
      `UPDATE users SET is_verified = TRUE, verification_token = NULL
       WHERE email = $1 AND verification_token = $2 RETURNING id`,
      [decoded.email, token]
    );

    if (!result.rows[0]) return res.status(400).json({ message: 'Invalid or expired token' });

    res.json({ message: 'Email verified successfully' });
  } catch (err) {
    res.status(400).json({ message: 'Invalid or expired token' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (!user.rows[0]) return res.json({ message: 'If that email exists, a reset link was sent.' });

    const token = generateShortToken({ userId: user.rows[0].id, purpose: 'reset' });
    const expires = new Date(Date.now() + 3600000);

    await db.query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [token, expires, user.rows[0].id]
    );

    await sendPasswordResetEmail(email, token);
    res.json({ message: 'If that email exists, a reset link was sent.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    const decoded = verifyToken(token);

    const result = await db.query(
      `SELECT id FROM users WHERE id = $1 AND reset_token = $2 AND reset_token_expires > NOW()`,
      [decoded.userId, token]
    );

    if (!result.rows[0]) return res.status(400).json({ message: 'Invalid or expired token' });

    const hash = await bcrypt.hash(password, 12);
    await db.query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
      [hash, decoded.userId]
    );

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    res.status(400).json({ message: 'Invalid or expired token' });
  }
};

const getMe = async (req, res) => {
  try {
    const profile = await db.query('SELECT * FROM profiles WHERE user_id = $1', [req.user.id]);
    res.json({ user: { ...req.user, profile: profile.rows[0] || null } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { signup, login, verifyEmail, forgotPassword, resetPassword, getMe };
