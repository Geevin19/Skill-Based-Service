const db = require('../db');

const getStats = async (req, res) => {
  try {
    const [users, sessions, bookings, payments, reports] = await Promise.all([
      db.query('SELECT COUNT(*) FROM users'),
      db.query('SELECT COUNT(*) FROM sessions'),
      db.query('SELECT COUNT(*) FROM bookings'),
      db.query(`SELECT SUM(amount) as revenue FROM payments WHERE status='completed'`),
      db.query(`SELECT COUNT(*) FROM reports WHERE status='open'`),
    ]);
    res.json({
      total_users: users.rows[0].count,
      total_sessions: sessions.rows[0].count,
      total_bookings: bookings.rows[0].count,
      total_revenue: payments.rows[0].revenue || 0,
      open_reports: reports.rows[0].count,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const conditions = [];
    const values = [];
    let idx = 1;

    if (role) { conditions.push(`u.role = $${idx++}`); values.push(role); }
    if (search) {
      conditions.push(`(u.email ILIKE $${idx} OR p.name ILIKE $${idx})`);
      values.push(`%${search}%`); idx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    values.push(limit, offset);

    const result = await db.query(
      `SELECT u.id, u.email, u.role, u.is_active, u.is_verified, u.created_at,
              p.name, p.avg_rating, p.is_mentor_approved
       FROM users u LEFT JOIN profiles p ON u.id = p.user_id
       ${where} ORDER BY u.created_at DESC LIMIT $${idx++} OFFSET $${idx}`,
      values
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { is_active, role } = req.body;
    await db.query(
      'UPDATE users SET is_active=COALESCE($1,is_active), role=COALESCE($2,role) WHERE id=$3',
      [is_active, role, req.params.id]
    );
    res.json({ message: 'User updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const approveMentor = async (req, res) => {
  try {
    const { approved } = req.body;
    await db.query(
      'UPDATE profiles SET is_mentor_approved=$1 WHERE user_id=$2',
      [approved, req.params.id]
    );
    if (approved) {
      await db.query("UPDATE users SET role='mentor' WHERE id=$1", [req.params.id]);
    }
    res.json({ message: `Mentor ${approved ? 'approved' : 'rejected'}` });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getReports = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT r.*, rp.name as reporter_name, rd.name as reported_name
       FROM reports r
       JOIN profiles rp ON r.reporter_id = rp.user_id
       JOIN profiles rd ON r.reported_id = rd.user_id
       ORDER BY r.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const resolveReport = async (req, res) => {
  try {
    const { status } = req.body;
    await db.query('UPDATE reports SET status=$1 WHERE id=$2', [status, req.params.id]);
    res.json({ message: 'Report updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getStats, getUsers, updateUser, approveMentor, getReports, resolveReport };
