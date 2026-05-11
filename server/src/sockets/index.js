const setupSocketIO = (io) => {
  const onlineUsers = new Map();

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // User comes online
    socket.on('user:online', (userId) => {
      onlineUsers.set(userId, socket.id);
      io.emit('users:online', Array.from(onlineUsers.keys()));
    });

    // Join project room
    socket.on('project:join', (projectId) => {
      socket.join(`project:${projectId}`);
    });

    // Leave project room
    socket.on('project:leave', (projectId) => {
      socket.leave(`project:${projectId}`);
    });

    // Task updated
    socket.on('task:update', (data) => {
      socket.to(`project:${data.projectId}`).emit('task:updated', data);
    });

    // Task status changed (for Kanban board)
    socket.on('task:statusChange', (data) => {
      socket.to(`project:${data.projectId}`).emit('task:statusChanged', data);
    });

    // New notification
    socket.on('notification:send', (data) => {
      const recipientSocketId = onlineUsers.get(data.recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('notification:received', data);
      }
    });

    // Team messaging
    socket.on('message:send', (data) => {
      socket.to(`project:${data.projectId}`).emit('message:received', data);
    });

    // Disconnect
    socket.on('disconnect', () => {
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          break;
        }
      }
      io.emit('users:online', Array.from(onlineUsers.keys()));
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });
};

export default setupSocketIO;
