const { supabase } = require('../db');

const createReview = async (req, res) => {
  try {
    const { booking_id, rating, comment } = req.body;

    const { data: booking } = await supabase.from('bookings')
      .select('*').eq('id', booking_id).eq('learner_id', req.user.id).eq('status', 'completed').single();
    if (!booking) return res.status(400).json({ message: 'Booking not found or not completed' });

    const { data: existing } = await supabase.from('reviews').select('id').eq('booking_id', booking_id).single();
    if (existing) return res.status(409).json({ message: 'Review already submitted' });

    const { data, error } = await supabase.from('reviews').insert({
      booking_id, reviewer_id: req.user.id, reviewee_id: booking.mentor_id, rating, comment,
    }).select().single();
    if (error) throw error;

    // Update mentor avg rating
    const { data: reviews } = await supabase.from('reviews').select('rating').eq('reviewee_id', booking.mentor_id);
    if (reviews?.length) {
      const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      await supabase.from('profiles').update({ avg_rating: Math.round(avg * 100) / 100, total_reviews: reviews.length }).eq('user_id', booking.mentor_id);
    }

    res.status(201).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getMentorReviews = async (req, res) => {
  try {
    const { data, error } = await supabase.from('reviews')
      .select('*, profiles!reviews_reviewer_id_fkey(name, avatar_url)')
      .eq('reviewee_id', req.params.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    const reviews = (data || []).map(r => ({ ...r, reviewer_name: r.profiles?.name, reviewer_avatar: r.profiles?.avatar_url }));
    res.json(reviews);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createReview, getMentorReviews };
