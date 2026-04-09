const { supabase } = require('../db');

const getProfile = async (req, res) => {
  try {
    const { data: user } = await supabase.from('users').select('id, email, role').eq('id', req.params.id).eq('is_active', true).single();
    if (!user) return res.status(404).json({ message: 'User not found' });
    const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', req.params.id).single();
    res.json({ ...user, ...profile });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, bio, location, timezone, skills, experience_years, hourly_rate, certifications, portfolio, social_links } = req.body;
    const avatar_url = req.file ? `/uploads/${req.file.filename}` : undefined;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (bio !== undefined) updates.bio = bio;
    if (location !== undefined) updates.location = location;
    if (timezone !== undefined) updates.timezone = timezone;
    if (skills !== undefined) updates.skills = Array.isArray(skills) ? skills : [skills];
    if (experience_years !== undefined) updates.experience_years = parseInt(experience_years);
    if (hourly_rate !== undefined) updates.hourly_rate = parseFloat(hourly_rate);
    if (certifications !== undefined) updates.certifications = typeof certifications === 'string' ? JSON.parse(certifications) : certifications;
    if (portfolio !== undefined) updates.portfolio = typeof portfolio === 'string' ? JSON.parse(portfolio) : portfolio;
    if (social_links !== undefined) updates.social_links = typeof social_links === 'string' ? JSON.parse(social_links) : social_links;
    if (avatar_url) updates.avatar_url = avatar_url;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase.from('profiles').update(updates).eq('user_id', req.user.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const switchRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['mentor', 'learner'].includes(role)) return res.status(400).json({ message: 'Invalid role' });
    await supabase.from('users').update({ role }).eq('id', req.user.id);
    res.json({ message: `Role switched to ${role}` });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

const getMentors = async (req, res) => {
  try {
    const { skill, min_rating, max_price, search, page = 1, limit = 12 } = req.query;
    const from = (page - 1) * limit;
    const to = from + parseInt(limit) - 1;

    // First get all mentor user IDs
    const { data: mentorUsers } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'mentor')
      .eq('is_active', true);

    if (!mentorUsers?.length) return res.json({ mentors: [], total: 0, page: parseInt(page), pages: 0 });

    const mentorIds = mentorUsers.map(u => u.id);

    let query = supabase.from('profiles')
      .select('*, users!inner(id, email, role)', { count: 'exact' })
      .in('user_id', mentorIds)
      .range(from, to)
      .order('avg_rating', { ascending: false });

    if (min_rating) query = query.gte('avg_rating', parseFloat(min_rating));
    if (max_price) query = query.lte('hourly_rate', parseFloat(max_price));
    if (search) query = query.or(`name.ilike.%${search}%,bio.ilike.%${search}%`);
    if (skill) query = query.contains('skills', [skill]);

    const { data, error, count } = await query;
    if (error) throw error;

    const mentors = (data || []).map(p => ({
      ...p,
      id: p.users?.id || p.user_id,
      email: p.users?.email,
      role: p.users?.role,
    }));

    res.json({ mentors, total: count || 0, page: parseInt(page), pages: Math.ceil((count || 0) / limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getAvailability = async (req, res) => {
  try {
    const { data } = await supabase.from('availability').select('*').eq('mentor_id', req.params.id).order('day_of_week').order('start_time');
    res.json(data || []);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

const setAvailability = async (req, res) => {
  try {
    const { slots } = req.body;
    await supabase.from('availability').delete().eq('mentor_id', req.user.id);
    if (slots?.length) {
      const rows = slots.map(s => ({ mentor_id: req.user.id, day_of_week: s.day_of_week, start_time: s.start_time, end_time: s.end_time, is_recurring: s.is_recurring ?? true, specific_date: s.specific_date || null }));
      await supabase.from('availability').insert(rows);
    }
    res.json({ message: 'Availability updated' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getProfile, updateProfile, switchRole, getMentors, getAvailability, setAvailability };
