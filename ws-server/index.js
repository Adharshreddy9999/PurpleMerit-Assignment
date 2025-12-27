
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import jwt from 'jsonwebtoken';

const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});


// Redis adapter setup
const pubClient = createClient({ url: REDIS_URL });
const subClient = pubClient.duplicate();
await pubClient.connect();
await subClient.connect();
io.adapter(createAdapter(pubClient, subClient));

io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    socket.user = payload;
    next();
  } catch (err) {
    return next(new Error('Authentication error: Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id, 'User:', socket.user?.id);

  socket.on('join', (room) => {
    socket.join(room);
    io.to(room).emit('user-joined', { userId: socket.user?.id || socket.id });
    console.log(`User ${socket.user?.id || socket.id} joined room ${room}`);
  });

  socket.on('leave', (room) => {
    socket.leave(room);
    io.to(room).emit('user-left', { userId: socket.user?.id || socket.id });
    console.log(`User ${socket.user?.id || socket.id} left room ${room}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id, 'User:', socket.user?.id);
    // Optionally broadcast leave event to all rooms
  });

  // Mocked file change event
  socket.on('file-change', ({ room, fileId, content }) => {
    io.to(room).emit('file-changed', {
      userId: socket.user?.id || socket.id,
      fileId,
      content,
      timestamp: Date.now(),
    });
    console.log(`File changed in room ${room} by ${socket.user?.id || socket.id}`);
  });

  // Mocked activity/cursor update event
  socket.on('activity', ({ room, activity }) => {
    io.to(room).emit('activity-update', {
      userId: socket.user?.id || socket.id,
      activity,
      timestamp: Date.now(),
    });
    console.log(`Activity update in room ${room} by ${socket.user?.id || socket.id}`);
  });
});

const PORT = process.env.WS_PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});
