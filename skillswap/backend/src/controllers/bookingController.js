const { supabase } = require('../db');
const { createNotification } = require('../utils/notifications');
const { sendBookingConfirmation } = require('../utils/email');

const createBooking = async (req, res) => {
  try {
    const { session_id, scheduled_at, notes } = req.body;
    const { data: session } = await supabase.from('sessions').select('*').eq('id', session_id).eq('is_active', true).single();
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const { data: booking, error } = await supabase.from('bookings').insert({
      session_id, learner_id: req.user.id, mentor_id: session.mentor_id,
      scheduled_at, duration_minutes: session.duration_minutes,
      price: session.price, notes,
    }).select().single();
    if (error) throw error;

    await createNotification(session.mentor_id, 'booking_request', 'New Booking Request',
      `You have a new booking request for "${session.title}"`, { booking_id: booking.id });

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
    const field = isLearner ? 'learner_id' : 'mentor_id';

    let query = supabase.from('bookings')
      .select(`*, sessions(title, category), learner:profiles!bookings_learner_id_fkey(name, avatar_url), mentor:profiles!bookings_mentor_id_fkey(name, avatar_url)`)
      .eq(field, req.user.id)
      .order('scheduled_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;

    const bookings = (data || []).map(b => ({
      ...b,
      session_title: b.sessions?.title,
      learner_name: b.learner?.name,
      learner_avatar: b.learner?.avatar_url,
      mentor_name: b.mentor?.name,
      mentor_avatar: b.mentor?.avatar_url,
    }));
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getBooking = async (req, res) => {
  try {
    const { data, error } = await supabase.from('bookings')
      .select(`*, sessions(title), learner:profiles!bookings_learner_id_fkey(name), mentor:profiles!bookings_mentor_id_fkey(name)`)
      .eq('id', req.params.id).single();
    if (error || !data) return res.status(404).json({ message: 'Booking not found' });
    if (data.learner_id !== req.user.id && data.mentor_id !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    res.json({ ...data, session_title: data.sessions?.title, learner_name: data.learner?.name, mentor_name: data.mentor?.name });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    const { status, meeting_link, cancel_reason } = req.body;
    const allowed = ['confirmed', 'cancelled', 'completed', 'rescheduled'];
    if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' });

    const { data: existing } = await supabase.from('bookings').select('*').eq('id', req.params.id).single();
    if (!existing) return res.status(404).json({ message: 'Booking not found' });
    if (existing.learner_id !== req.user.id && existing.mentor_id !== req.user.id) return res.status(403).json({ message: 'Forbidden' });

    const updates = { status, updated_at: new Date().toISOString() };
    if (meeting_link) updates.meeting_link = meeting_link;
    if (status === 'cancelled') { updates.cancelled_by = req.user.id; updates.cancel_reason = cancel_reason; }

    const { data, error } = await supabase.from('bookings').update(updates).eq('id', req.params.id).select().single();
    if (error) throw error;

    const notifyId = req.user.id === existing.learner_id ? existing.mentor_id : existing.learner_id;
    await createNotification(notifyId, 'booking_update', 'Booking Updated', `Your booking status changed to ${status}`, { booking_id: data.id });

    if (status === 'confirmed') {
      const { data: learner } = await supabase.from('users').select('email').eq('id', existing.learner_id).single();
      if (learner) try { await sendBookingConfirmation(learner.email, data); } catch (_) {}
    }
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const rescheduleBooking = async (req, res) => {
  try {
    const { scheduled_at } = req.body;
    const { data, error } = await supabase.from('bookings')
      .update({ scheduled_at, status: 'rescheduled', updated_at: new Date().toISOString() })
      .eq('id', req.params.id).select().single();
    if (error || !data) return res.status(404).json({ message: 'Booking not found' });
    res.json(data);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createBooking, getMyBookings, getBooking, updateBookingStatus, rescheduleBooking };
