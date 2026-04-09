const bcrypt = require('bcryptjs');
const { supabase } = require('../db');
const { generateToken, generateShortToken, verifyToken } = require('../utils/jwt');
const { sendWelcomeEmail, sendPasswordResetEmail, sendAdminNewUser } = require('../utils/email');

const signup = async (req, res) => {
  try {
    const { email, password, name, role = 'learner' } = req.body;

    const { data: existing } = await supabase.from('users').select('id').eq('email', email).single();
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const hash = await bcrypt.hash(password, 12);

    const { data: user, error } = await supabase.from('users').insert({
      email, password_hash: hash, role, is_verified: true,
    }).select('id, email, role').single();

    if (error) throw error;

    await supabase.from('profiles').insert({ user_id: user.id, name });

    // Send welcome email and admin notification (non-blocking)
    sendWelcomeEmail(email, name).catch(() => {});
    sendAdminNewUser(name, email, role).catch(() => {});

    res.status(201).json({ message: 'Account created successfully. You can now log in.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data: user } = await supabase.from('users')
      .select('id, email, password_hash, role, is_active')
      .eq('email', email).single();

    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    if (!user.is_active) return res.status(403).json({ message: 'Account suspended' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    const token = generateToken(user.id, user.role);
    const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();

    res.json({ token, user: { id: user.id, email: user.email, role: user.role, profile: profile || null } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const { data: user } = await supabase.from('users').select('id').eq('email', email).single();
    if (!user) return res.json({ message: 'If that email exists, a reset link was sent.' });

    const token = generateShortToken({ userId: user.id, purpose: 'reset' });
    const expires = new Date(Date.now() + 3600000).toISOString();

    await supabase.from('users').update({ reset_token: token, reset_token_expires: expires }).eq('id', user.id);
    sendPasswordResetEmail(email, token).catch(() => {});

    res.json({ message: 'If that email exists, a reset link was sent.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    const decoded = verifyToken(token);

    const { data: user } = await supabase.from('users')
      .select('id, reset_token_expires')
      .eq('id', decoded.userId).eq('reset_token', token).single();

    if (!user || new Date(user.reset_token_expires) < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const hash = await bcrypt.hash(password, 12);
    await supabase.from('users').update({ password_hash: hash, reset_token: null, reset_token_expires: null }).eq('id', decoded.userId);

    res.json({ message: 'Password reset successfully' });
  } catch {
    res.status(400).json({ message: 'Invalid or expired token' });
  }
};

const getMe = async (req, res) => {
  try {
    const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', req.user.id).single();
    res.json({ user: { ...req.user, profile: profile || null } });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { signup, login, forgotPassword, resetPassword, getMe };
