const db = require('../db');

const createNotification = async (userId, type, title, message, data = {}) => {
  const result = await db.query(
    `INSERT INTO notifications (user_id, type, title, message, data)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [userId, type, title, message, JSON.stringify(data)]
  );
  return result.rows[0];
};

module.exports = { createNotification };
