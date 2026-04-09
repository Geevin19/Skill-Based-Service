const jwt = require('jsonwebtoken');
const db = require('./db');

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
        const result = await db.query(
          `INSERT INTO messages (sender_id, receiver_id, booking_id, content, file_url, file_name, file_type)
           VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
          [socket.userId, receiver_id, booking_id || null, content, file_url || null, file_name || null, file_type || null]
        );
        const message = result.rows[0];

        // Send to receiver if online
        const receiverSocketId = onlineUsers.get(receiver_id);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('new_message', message);
        }
        socket.emit('message_sent', message);
      } catch (err) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('typing', ({ receiver_id }) => {
      const receiverSocketId = onlineUsers.get(receiver_id);
      if (receiverSocketId) io.to(receiverSocketId).emit('user_typing', { userId: socket.userId });
    });

    // WebRTC signaling
    socket.on('webrtc_offer', ({ target, offer }) => {
      const targetSocket = onlineUsers.get(target);
      if (targetSocket) io.to(targetSocket).emit('webrtc_offer', { from: socket.userId, offer });
    });

    socket.on('webrtc_answer', ({ target, answer }) => {
      const targetSocket = onlineUsers.get(target);
      if (targetSocket) io.to(targetSocket).emit('webrtc_answer', { from: socket.userId, answer });
    });

    socket.on('webrtc_ice_candidate', ({ target, candidate }) => {
      const targetSocket = onlineUsers.get(target);
      if (targetSocket) io.to(targetSocket).emit('webrtc_ice_candidate', { from: socket.userId, candidate });
    });

    socket.on('disconnect', () => {
      onlineUsers.delete(socket.userId);
      io.emit('user_offline', { userId: socket.userId });
    });
  });
};

module.exports = { initSocket };
