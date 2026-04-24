import { Server, Socket } from 'socket.io';
import logger from '../utils/logger';

/**
 * Socket.io handlers - minimal implementation without collaboration
 */

export function initSocketHandlers(io: Server): void {
  io.on('connection', (socket: Socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });
}
