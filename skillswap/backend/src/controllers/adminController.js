const { supabase } = require('../db');

const getStats = async (req, res) => {
  try {
    const [users, sessions, bookings, payments, reports] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('sessions').select('*', { count: 'exact', head: true }),
      supabase.from('bookings').select('*', { count: 'exact', head: true }),
      supabase.from('payments').select('amount').eq('status', 'completed'),
      supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    ]);
    const revenue = (payments.data || []).reduce((s, p) => s + parseFloat(p.amount), 0);
    res.json({ total_users: users.count, total_sessions: sessions.count, total_bookings: bookings.count, total_revenue: revenue, open_reports: reports.count });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const from = (page - 1) * limit;
    const to = from + parseInt(limit) - 1;

    let query = supabase.from('users').select('id, email, role, is_active, is_verified, created_at, profiles(name, avg_rating, is_mentor_approved)').range(from, to).order('created_at', { ascending: false });
    if (role) query = query.eq('role', role);

    const { data, error } = await query;
    if (error) throw error;

    let users = (data || []).map(u => ({ ...u, name: u.profiles?.name, avg_rating: u.profiles?.avg_rating, is_mentor_approved: u.profiles?.is_mentor_approved }));
    if (search) users = users.filter(u => u.email?.toLowerCase().includes(search.toLowerCase()) || u.name?.toLowerCase().includes(search.toLowerCase()));
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { is_active, role } = req.body;
    const updates = {};
    if (is_active !== undefined) updates.is_active = is_active;
    if (role) updates.role = role;
    await supabase.from('users').update(updates).eq('id', req.params.id);
    res.json({ message: 'User updated' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

const approveMentor = async (req, res) => {
  try {
    const { approved } = req.body;
    await supabase.from('profiles').update({ is_mentor_approved: approved }).eq('user_id', req.params.id);
    if (approved) await supabase.from('users').update({ role: 'mentor' }).eq('id', req.params.id);
    res.json({ message: `Mentor ${approved ? 'approved' : 'rejected'}` });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

const getReports = async (req, res) => {
  try {
    const { data, error } = await supabase.from('reports')
      .select('*, reporter:profiles!reports_reporter_id_fkey(name), reported:profiles!reports_reported_id_fkey(name)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    const reports = (data || []).map(r => ({ ...r, reporter_name: r.reporter?.name, reported_name: r.reported?.name }));
    res.json(reports);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

const resolveReport = async (req, res) => {
  try {
    await supabase.from('reports').update({ status: req.body.status }).eq('id', req.params.id);
    res.json({ message: 'Report updated' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getStats, getUsers, updateUser, approveMentor, getReports, resolveReport };
