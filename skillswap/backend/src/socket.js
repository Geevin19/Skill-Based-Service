const jwt = require('jsonwebtoken');
const { supabase } = require('./db');

const onlineUsers = new Map();

const initSocket = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    onlineUsers.set(socket.userId, socket.id);
    io.emit('user_online', { userId: socket.userId });

    socket.on('join_room', (roomId) => socket.join(roomId));

    socket.on('send_message', async (data) => {
      try {
        const { receiver_id, content, booking_id, file_url, file_name, file_type } = data;
        const { data: message } = await supabase.from('messages').insert({
          sender_id: socket.userId, receiver_id,
          booking_id: booking_id || null,
          content, file_url: file_url || null,
          file_name: file_name || null,
          file_type: file_type || null,
        }).select().single();

        const receiverSocketId = onlineUsers.get(receiver_id);
        if (receiverSocketId) io.to(receiverSocketId).emit('new_message', message);
        socket.emit('message_sent', message);
      } catch (err) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('typing', ({ receiver_id }) => {
      const receiverSocketId = onlineUsers.get(receiver_id);
      if (receiverSocketId) io.to(receiverSocketId).emit('user_typing', { userId: socket.userId });
    });

    socket.on('webrtc_offer', ({ target, offer }) => {
      const t = onlineUsers.get(target);
      if (t) io.to(t).emit('webrtc_offer', { from: socket.userId, offer });
    });

    socket.on('webrtc_answer', ({ target, answer }) => {
      const t = onlineUsers.get(target);
      if (t) io.to(t).emit('webrtc_answer', { from: socket.userId, answer });
    });

    socket.on('webrtc_ice_candidate', ({ target, candidate }) => {
      const t = onlineUsers.get(target);
      if (t) io.to(t).emit('webrtc_ice_candidate', { from: socket.userId, candidate });
    });

    socket.on('disconnect', () => {
      onlineUsers.delete(socket.userId);
      io.emit('user_offline', { userId: socket.userId });
    });
  });
};

module.exports = { initSocket };
