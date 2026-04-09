const { supabase } = require('../db');

const getConversations = async (req, res) => {
  try {
    const { data: sent } = await supabase.from('messages').select('receiver_id').eq('sender_id', req.user.id);
    const { data: received } = await supabase.from('messages').select('sender_id').eq('receiver_id', req.user.id);

    const userIds = [...new Set([
      ...(sent || []).map(m => m.receiver_id),
      ...(received || []).map(m => m.sender_id),
    ])].filter(id => id !== req.user.id);

    const conversations = await Promise.all(userIds.map(async (otherId) => {
      const { data: profile } = await supabase.from('profiles').select('name, avatar_url').eq('user_id', otherId).single();
      const { data: lastMsg } = await supabase.from('messages')
        .select('content, created_at')
        .or(`and(sender_id.eq.${req.user.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${req.user.id})`)
        .order('created_at', { ascending: false }).limit(1).single();
      const { count } = await supabase.from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('sender_id', otherId).eq('receiver_id', req.user.id).eq('is_read', false);
      return { other_user: otherId, name: profile?.name, avatar_url: profile?.avatar_url, last_message: lastMsg?.content, created_at: lastMsg?.created_at, unread_count: count || 0 };
    }));

    res.json(conversations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const from = (page - 1) * limit;
    const to = from + parseInt(limit) - 1;

    await supabase.from('messages').update({ is_read: true }).eq('sender_id', userId).eq('receiver_id', req.user.id);

    const { data, error } = await supabase.from('messages')
      .select('*, profiles!messages_sender_id_fkey(name, avatar_url)')
      .or(`and(sender_id.eq.${req.user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${req.user.id})`)
      .order('created_at', { ascending: true })
      .range(from, to);

    if (error) throw error;
    const messages = (data || []).map(m => ({ ...m, sender_name: m.profiles?.name, sender_avatar: m.profiles?.avatar_url }));
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { receiver_id, content, booking_id } = req.body;
    const file_url = req.file ? `/uploads/${req.file.filename}` : null;
    const file_name = req.file ? req.file.originalname : null;
    const file_type = req.file ? req.file.mimetype : null;

    const { data, error } = await supabase.from('messages').insert({
      sender_id: req.user.id, receiver_id, booking_id: booking_id || null,
      content, file_url, file_name, file_type,
    }).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getConversations, getMessages, sendMessage };
