const db = require('../db');

const createSession = async (req, res) => {
  try {
    const { title, description, category, skills, session_type, duration_minutes, price, max_participants } = req.body;
    const result = await db.query(
      `INSERT INTO sessions (mentor_id, title, description, category, skills, session_type, duration_minutes, price, max_participants)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.user.id, title, description, category, skills, session_type || '1-on-1', duration_minutes, price, max_participants || 1]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getSessions = async (req, res) => {
  try {
    const { mentor_id, category, session_type, page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;
    const conditions = ['s.is_active = TRUE'];
    const values = [];
    let idx = 1;

    if (mentor_id) { conditions.push(`s.mentor_id = $${idx++}`); values.push(mentor_id); }
    if (category) { conditions.push(`s.category = $${idx++}`); values.push(category); }
    if (session_type) { conditions.push(`s.session_type = $${idx++}`); values.push(session_type); }

    values.push(limit, offset);
    const result = await db.query(
      `SELECT s.*, p.name as mentor_name, p.avatar_url, p.avg_rating
       FROM sessions s JOIN profiles p ON s.mentor_id = p.user_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY s.created_at DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      values
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getSession = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT s.*, p.name as mentor_name, p.avatar_url, p.avg_rating, p.bio
       FROM sessions s JOIN profiles p ON s.mentor_id = p.user_id
       WHERE s.id = $1`,
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ message: 'Session not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateSession = async (req, res) => {
  try {
    const { title, description, category, skills, duration_minutes, price, max_participants, is_active } = req.body;
    const result = await db.query(
      `UPDATE sessions SET title=$1, description=$2, category=$3, skills=$4,
       duration_minutes=$5, price=$6, max_participants=$7, is_active=$8, updated_at=NOW()
       WHERE id=$9 AND mentor_id=$10 RETURNING *`,
      [title, description, category, skills, duration_minutes, price, max_participants, is_active, req.params.id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ message: 'Session not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteSession = async (req, res) => {
  try {
    await db.query('UPDATE sessions SET is_active=FALSE WHERE id=$1 AND mentor_id=$2', [req.params.id, req.user.id]);
    res.json({ message: 'Session deactivated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createSession, getSessions, getSession, updateSession, deleteSession };
