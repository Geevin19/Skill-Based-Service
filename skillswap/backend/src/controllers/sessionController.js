const { supabase } = require('../db');

const createSession = async (req, res) => {
  try {
    const { title, description, category, skills, session_type, duration_minutes, price, max_participants } = req.body;
    const { data, error } = await supabase.from('sessions').insert({
      mentor_id: req.user.id, title, description, category,
      skills: Array.isArray(skills) ? skills : skills ? [skills] : [],
      session_type: session_type || '1-on-1',
      duration_minutes: parseInt(duration_minutes),
      price: parseFloat(price),
      max_participants: parseInt(max_participants) || 1,
    }).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getSessions = async (req, res) => {
  try {
    const { mentor_id, category, session_type, page = 1, limit = 12 } = req.query;
    const from = (page - 1) * limit;
    const to = from + parseInt(limit) - 1;

    let query = supabase.from('sessions')
      .select('*, profiles!inner(name, avatar_url, avg_rating)')
      .eq('is_active', true)
      .range(from, to)
      .order('created_at', { ascending: false });

    if (mentor_id) query = query.eq('mentor_id', mentor_id);
    if (category) query = query.eq('category', category);
    if (session_type) query = query.eq('session_type', session_type);

    const { data, error } = await query;
    if (error) throw error;

    const sessions = (data || []).map(s => ({
      ...s,
      mentor_name: s.profiles?.name,
      avatar_url: s.profiles?.avatar_url,
      avg_rating: s.profiles?.avg_rating,
    }));
    res.json(sessions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getSession = async (req, res) => {
  try {
    const { data, error } = await supabase.from('sessions')
      .select('*, profiles!inner(name, avatar_url, avg_rating, bio)')
      .eq('id', req.params.id).single();
    if (error || !data) return res.status(404).json({ message: 'Session not found' });
    res.json({ ...data, mentor_name: data.profiles?.name, avatar_url: data.profiles?.avatar_url });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateSession = async (req, res) => {
  try {
    const { title, description, category, skills, duration_minutes, price, max_participants, is_active } = req.body;
    const { data, error } = await supabase.from('sessions')
      .update({ title, description, category, skills, duration_minutes, price, max_participants, is_active, updated_at: new Date().toISOString() })
      .eq('id', req.params.id).eq('mentor_id', req.user.id).select().single();
    if (error || !data) return res.status(404).json({ message: 'Session not found' });
    res.json(data);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteSession = async (req, res) => {
  try {
    await supabase.from('sessions').update({ is_active: false }).eq('id', req.params.id).eq('mentor_id', req.user.id);
    res.json({ message: 'Session deactivated' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createSession, getSessions, getSession, updateSession, deleteSession };
