const jwt = require('jsonwebtoken');
const { supabase } = require('../db');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ message: 'No token provided' });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { data: user } = await supabase.from('users').select('id, email, role, is_active').eq('id', decoded.userId).single();
    if (!user || !user.is_active) return res.status(401).json({ message: 'User not found or inactive' });

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Access denied' });
  next();
};

module.exports = { authenticate, authorize };
