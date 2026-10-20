import jwt from 'jsonwebtoken';
import { Server, Socket } from 'socket.io';
import logger from '../utils/logger';
import { User } from '../models/user.model';

interface Participant {
  socketId: string;
  userId?: string;
  username: string;
  diagramId: string;
}

const activeParticipants = new Map<string, Participant>();

export function initSocketHandlers(io: Server): void {
  // Handshake authentication middleware
  io.use(async (socket: Socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers?.authorization?.startsWith('Bearer ')
          ? socket.handshake.headers.authorization.substring(7)
          : null);

      if (token) {
        const secret = process.env.JWT_ACCESS_SECRET || 'dev-access-secret';
        const decoded = jwt.verify(token, secret) as { userId: string };
        socket.data.userId = decoded.userId;
        const user = await User.findById(decoded.userId).select('name email');
        if (user) {
          socket.data.username = user.name || user.email.split('@')[0];
        }
      }
      return next();
    } catch (err: any) {
      logger.warn(`Socket handshake token verification failed: ${err.message}`);
      // Allow connection with guest status for public viewable diagrams
      return next();
    }
  });

  io.on('connection', (socket: Socket) => {
    logger.info(`Socket connected: ${socket.id} (user: ${socket.data.userId || 'guest'})`);

    socket.on('join-diagram', ({ diagramId, username }: { diagramId: string; username?: string }) => {
      if (!diagramId) return;

      const effectiveUsername = socket.data.username || username || `Guest-${socket.id.slice(0, 4)}`;
      logger.info(`User ${effectiveUsername} (${socket.id}) joined diagram ${diagramId}`);

      socket.join(diagramId);

      activeParticipants.set(socket.id, {
        socketId: socket.id,
        userId: socket.data.userId,
        username: effectiveUsername,
        diagramId,
      });

      const roomParticipants = Array.from(activeParticipants.values())
        .filter((p) => p.diagramId === diagramId);
      io.to(diagramId).emit('participants-updated', roomParticipants);
    });

    socket.on('cursor-move', (position: { x: number; y: number }) => {
      const participant = activeParticipants.get(socket.id);
      if (participant && typeof position?.x === 'number' && typeof position?.y === 'number') {
        socket.to(participant.diagramId).emit('cursor-update', {
          socketId: socket.id,
          username: participant.username,
          userId: participant.userId,
          x: position.x,
          y: position.y,
        });
      }
    });

    const handleLeave = () => {
      const participant = activeParticipants.get(socket.id);
      if (participant) {
        logger.info(`User ${participant.username} (${socket.id}) left diagram ${participant.diagramId}`);
        socket.leave(participant.diagramId);
        activeParticipants.delete(socket.id);

        const roomParticipants = Array.from(activeParticipants.values())
          .filter((p) => p.diagramId === participant.diagramId);
        io.to(participant.diagramId).emit('participants-updated', roomParticipants);

        socket.to(participant.diagramId).emit('cursor-removed', socket.id);
      }
    };

    socket.on('leave-diagram', handleLeave);
    socket.on('disconnect', handleLeave);
  });
}
