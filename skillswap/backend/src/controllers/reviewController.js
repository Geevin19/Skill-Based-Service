const db = require('../db');

const createReview = async (req, res) => {
  try {
    const { booking_id, rating, comment } = req.body;

    const booking = await db.query(
      `SELECT * FROM bookings WHERE id = $1 AND learner_id = $2 AND status = 'completed'`,
      [booking_id, req.user.id]
    );
    if (!booking.rows[0]) return res.status(400).json({ message: 'Booking not found or not completed' });

    const existing = await db.query('SELECT id FROM reviews WHERE booking_id = $1', [booking_id]);
    if (existing.rows[0]) return res.status(409).json({ message: 'Review already submitted' });

    const b = booking.rows[0];
    const result = await db.query(
      `INSERT INTO reviews (booking_id, reviewer_id, reviewee_id, rating, comment)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [booking_id, req.user.id, b.mentor_id, rating, comment]
    );

    // Update mentor avg rating
    await db.query(
      `UPDATE profiles SET
         avg_rating = (SELECT AVG(rating) FROM reviews WHERE reviewee_id = $1),
         total_reviews = (SELECT COUNT(*) FROM reviews WHERE reviewee_id = $1)
       WHERE user_id = $1`,
      [b.mentor_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getMentorReviews = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT r.*, p.name as reviewer_name, p.avatar_url as reviewer_avatar
       FROM reviews r JOIN profiles p ON r.reviewer_id = p.user_id
       WHERE r.reviewee_id = $1
       ORDER BY r.created_at DESC`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createReview, getMentorReviews };
