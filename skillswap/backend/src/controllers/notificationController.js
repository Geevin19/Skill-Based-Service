const db = require('../db');

const getNotifications = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const markRead = async (req, res) => {
  try {
    await db.query(
      'UPDATE notifications SET is_read=TRUE WHERE user_id=$1 AND id=ANY($2)',
      [req.user.id, req.body.ids]
    );
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const markAllRead = async (req, res) => {
  try {
    await db.query('UPDATE notifications SET is_read=TRUE WHERE user_id=$1', [req.user.id]);
    res.json({ message: 'All marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const createReport = async (req, res) => {
  try {
    const { reported_id, reason, description } = req.body;
    await db.query(
      'INSERT INTO reports (reporter_id, reported_id, reason, description) VALUES ($1,$2,$3,$4)',
      [req.user.id, reported_id, reason, description]
    );
    res.status(201).json({ message: 'Report submitted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getNotifications, markRead, markAllRead, createReport };
