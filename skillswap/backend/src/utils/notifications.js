const { supabase } = require('../db');

const createNotification = async (userId, type, title, message, data = {}) => {
  const { data: notif } = await supabase.from('notifications').insert({ user_id: userId, type, title, message, data }).select().single();
  return notif;
};

module.exports = { createNotification };
