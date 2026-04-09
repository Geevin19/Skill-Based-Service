const db = require('../db');
const { createNotification } = require('../utils/notifications');
const { sendBookingConfirmation } = require('../utils/email');

const createBooking = async (req, res) => {
  try {
    const { session_id, scheduled_at, notes } = req.body;

    const session = await db.query('SELECT * FROM sessions WHERE id = $1 AND is_active = TRUE', [session_id]);
    if (!session.rows[0]) return res.status(404).json({ message: 'Session not found' });

    const s = session.rows[0];
    const result = await db.query(
      `INSERT INTO bookings (session_id, learner_id, mentor_id, scheduled_at, duration_minutes, price, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [session_id, req.user.id, s.mentor_id, scheduled_at, s.duration_minutes, s.price, notes]
    );

    const booking = result.rows[0];

    await createNotification(s.mentor_id, 'booking_request', 'New Booking Request',
      `You have a new booking request for "${s.title}"`, { booking_id: booking.id });

    res.status(201).json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getMyBookings = async (req, res) => {
  try {
    const { role, status } = req.query;
    const isLearner = role === 'learner' || req.user.role === 'learner';
    const field = isLearner ? 'b.learner_id' : 'b.mentor_id';

    let query = `
      SELECT b.*, s.title as session_title, s.category,
             lp.name as learner_name, lp.avatar_url as learner_avatar,
             mp.name as mentor_name, mp.avatar_url as mentor_avatar
      FROM bookings b
      LEFT JOIN sessions s ON b.session_id = s.id
      LEFT JOIN profiles lp ON b.learner_id = lp.user_id
      LEFT JOIN profiles mp ON b.mentor_id = mp.user_id
      WHERE ${field} = $1`;

    const values = [req.user.id];
    if (status) { query += ` AND b.status = $2`; values.push(status); }
    query += ' ORDER BY b.scheduled_at DESC';

    const result = await db.query(query, values);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getBooking = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT b.*, s.title as session_title,
              lp.name as learner_name, mp.name as mentor_name
       FROM bookings b
       LEFT JOIN sessions s ON b.session_id = s.id
       LEFT JOIN profiles lp ON b.learner_id = lp.user_id
       LEFT JOIN profiles mp ON b.mentor_id = mp.user_id
       WHERE b.id = $1 AND (b.learner_id = $2 OR b.mentor_id = $2)`,
      [req.params.id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ message: 'Booking not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    const { status, meeting_link, cancel_reason } = req.body;
    const allowed = ['confirmed', 'cancelled', 'completed', 'rescheduled'];
    if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' });

    const booking = await db.query(
      'SELECT * FROM bookings WHERE id = $1 AND (learner_id = $2 OR mentor_id = $2)',
      [req.params.id, req.user.id]
    );
    if (!booking.rows[0]) return res.status(404).json({ message: 'Booking not found' });

    const result = await db.query(
      `UPDATE bookings SET status=$1, meeting_link=COALESCE($2, meeting_link),
       cancelled_by=CASE WHEN $1='cancelled' THEN $3 ELSE cancelled_by END,
       cancel_reason=COALESCE($4, cancel_reason), updated_at=NOW()
       WHERE id=$5 RETURNING *`,
      [status, meeting_link, req.user.id, cancel_reason, req.params.id]
    );

    const b = result.rows[0];
    const notifyId = req.user.id === b.learner_id ? b.mentor_id : b.learner_id;
    await createNotification(notifyId, 'booking_update', 'Booking Updated',
      `Your booking status changed to ${status}`, { booking_id: b.id });

    if (status === 'confirmed') {
      const learner = await db.query('SELECT email FROM users WHERE id = $1', [b.learner_id]);
      if (learner.rows[0]) await sendBookingConfirmation(learner.rows[0].email, b);
    }

    res.json(b);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const rescheduleBooking = async (req, res) => {
  try {
    const { scheduled_at } = req.body;
    const result = await db.query(
      `UPDATE bookings SET scheduled_at=$1, status='rescheduled', updated_at=NOW()
       WHERE id=$2 AND (learner_id=$3 OR mentor_id=$3) RETURNING *`,
      [scheduled_at, req.params.id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ message: 'Booking not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createBooking, getMyBookings, getBooking, updateBookingStatus, rescheduleBooking };
