const db = require('../db');

const getConversations = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT DISTINCT ON (other_user)
         CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END as other_user,
         p.name, p.avatar_url,
         m.content as last_message, m.created_at,
         COUNT(CASE WHEN m.receiver_id = $1 AND m.is_read = FALSE THEN 1 END) OVER (
           PARTITION BY CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END
         ) as unread_count
       FROM messages m
       JOIN profiles p ON p.user_id = CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END
       WHERE m.sender_id = $1 OR m.receiver_id = $1
       ORDER BY other_user, m.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    await db.query(
      'UPDATE messages SET is_read = TRUE WHERE sender_id = $1 AND receiver_id = $2',
      [userId, req.user.id]
    );

    const result = await db.query(
      `SELECT m.*, p.name as sender_name, p.avatar_url as sender_avatar
       FROM messages m JOIN profiles p ON m.sender_id = p.user_id
       WHERE (m.sender_id = $1 AND m.receiver_id = $2)
          OR (m.sender_id = $2 AND m.receiver_id = $1)
       ORDER BY m.created_at DESC
       LIMIT $3 OFFSET $4`,
      [req.user.id, userId, limit, offset]
    );
    res.json(result.rows.reverse());
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { receiver_id, content, booking_id } = req.body;
    const file_url = req.file ? `/uploads/${req.file.filename}` : null;
    const file_name = req.file ? req.file.originalname : null;
    const file_type = req.file ? req.file.mimetype : null;

    const result = await db.query(
      `INSERT INTO messages (sender_id, receiver_id, booking_id, content, file_url, file_name, file_type)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.user.id, receiver_id, booking_id || null, content, file_url, file_name, file_type]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getConversations, getMessages, sendMessage };
