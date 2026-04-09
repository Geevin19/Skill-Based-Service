const db = require('../db');

const getProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT u.id, u.email, u.role, p.*
       FROM users u JOIN profiles p ON u.id = p.user_id
       WHERE u.id = $1 AND u.is_active = TRUE`,
      [id]
    );
    if (!result.rows[0]) return res.status(404).json({ message: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, bio, location, timezone, skills, experience_years, hourly_rate, certifications, portfolio, social_links } = req.body;
    const avatar_url = req.file ? `/uploads/${req.file.filename}` : undefined;

    const fields = [];
    const values = [];
    let idx = 1;

    const addField = (col, val) => {
      if (val !== undefined) { fields.push(`${col} = $${idx++}`); values.push(val); }
    };

    addField('name', name);
    addField('bio', bio);
    addField('location', location);
    addField('timezone', timezone);
    addField('skills', skills);
    addField('experience_years', experience_years);
    addField('hourly_rate', hourly_rate);
    addField('certifications', certifications ? JSON.stringify(certifications) : undefined);
    addField('portfolio', portfolio ? JSON.stringify(portfolio) : undefined);
    addField('social_links', social_links ? JSON.stringify(social_links) : undefined);
    if (avatar_url) addField('avatar_url', avatar_url);
    addField('updated_at', new Date());

    if (!fields.length) return res.status(400).json({ message: 'No fields to update' });

    values.push(req.user.id);
    const result = await db.query(
      `UPDATE profiles SET ${fields.join(', ')} WHERE user_id = $${idx} RETURNING *`,
      values
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const switchRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['mentor', 'learner'].includes(role)) return res.status(400).json({ message: 'Invalid role' });

    await db.query('UPDATE users SET role = $1 WHERE id = $2', [role, req.user.id]);
    res.json({ message: `Role switched to ${role}` });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getMentors = async (req, res) => {
  try {
    const { skill, min_rating, max_price, search, page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;

    let conditions = [`u.role = 'mentor'`, `u.is_active = TRUE`, `p.is_mentor_approved = TRUE`];
    const values = [];
    let idx = 1;

    if (skill) { conditions.push(`$${idx++} = ANY(p.skills)`); values.push(skill); }
    if (min_rating) { conditions.push(`p.avg_rating >= $${idx++}`); values.push(min_rating); }
    if (max_price) { conditions.push(`p.hourly_rate <= $${idx++}`); values.push(max_price); }
    if (search) {
      conditions.push(`(p.name ILIKE $${idx} OR p.bio ILIKE $${idx})`);
      values.push(`%${search}%`); idx++;
    }

    const where = conditions.join(' AND ');
    values.push(limit, offset);

    const result = await db.query(
      `SELECT u.id, u.email, u.role, p.name, p.bio, p.avatar_url, p.skills,
              p.experience_years, p.hourly_rate, p.avg_rating, p.total_reviews, p.total_sessions
       FROM users u JOIN profiles p ON u.id = p.user_id
       WHERE ${where}
       ORDER BY p.avg_rating DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      values
    );

    const countResult = await db.query(
      `SELECT COUNT(*) FROM users u JOIN profiles p ON u.id = p.user_id WHERE ${where}`,
      values.slice(0, -2)
    );

    res.json({
      mentors: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      pages: Math.ceil(countResult.rows[0].count / limit),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'SELECT * FROM availability WHERE mentor_id = $1 ORDER BY day_of_week, start_time',
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const setAvailability = async (req, res) => {
  try {
    const { slots } = req.body;
    await db.query('DELETE FROM availability WHERE mentor_id = $1', [req.user.id]);

    for (const slot of slots) {
      await db.query(
        `INSERT INTO availability (mentor_id, day_of_week, start_time, end_time, is_recurring, specific_date)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [req.user.id, slot.day_of_week, slot.start_time, slot.end_time, slot.is_recurring ?? true, slot.specific_date || null]
      );
    }
    res.json({ message: 'Availability updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getProfile, updateProfile, switchRole, getMentors, getAvailability, setAvailability };
