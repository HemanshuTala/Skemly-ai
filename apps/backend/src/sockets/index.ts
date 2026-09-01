import { Server, Socket } from 'socket.io';
import logger from '../utils/logger';

interface Participant {
  socketId: string;
  username: string;
  diagramId: string;
}

const activeParticipants = new Map<string, Participant>();

export function initSocketHandlers(io: Server): void {
  io.on('connection', (socket: Socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on('join-diagram', ({ diagramId, username }: { diagramId: string; username: string }) => {
      logger.info(`User ${username} (${socket.id}) joined diagram ${diagramId}`);
      
      socket.join(diagramId);

      activeParticipants.set(socket.id, {
        socketId: socket.id,
        username,
        diagramId,
      });

      const roomParticipants = Array.from(activeParticipants.values())
        .filter(p => p.diagramId === diagramId);
      io.to(diagramId).emit('participants-updated', roomParticipants);
    });

    socket.on('cursor-move', (position: { x: number; y: number }) => {
      const participant = activeParticipants.get(socket.id);
      if (participant) {
        socket.to(participant.diagramId).emit('cursor-update', {
          socketId: socket.id,
          username: participant.username,
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
          .filter(p => p.diagramId === participant.diagramId);
        io.to(participant.diagramId).emit('participants-updated', roomParticipants);
        
        socket.to(participant.diagramId).emit('cursor-removed', socket.id);
      }
    };

    socket.on('leave-diagram', handleLeave);
    socket.on('disconnect', handleLeave);
  });
}
