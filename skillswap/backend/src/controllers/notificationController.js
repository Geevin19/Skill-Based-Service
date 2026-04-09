const { supabase } = require('../db');

const getNotifications = async (req, res) => {
  try {
    const { data } = await supabase.from('notifications').select('*').eq('user_id', req.user.id).order('created_at', { ascending: false }).limit(50);
    res.json(data || []);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

const markRead = async (req, res) => {
  try {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', req.user.id).in('id', req.body.ids);
    res.json({ message: 'Marked as read' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

const markAllRead = async (req, res) => {
  try {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', req.user.id);
    res.json({ message: 'All marked as read' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

const createReport = async (req, res) => {
  try {
    const { reported_id, reason, description } = req.body;
    await supabase.from('reports').insert({ reporter_id: req.user.id, reported_id, reason, description });
    res.status(201).json({ message: 'Report submitted' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getNotifications, markRead, markAllRead, createReport };
