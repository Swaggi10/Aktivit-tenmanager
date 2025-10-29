import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { verifyToken } from '../utils/jwt';
import { logger } from '../utils/logger';
import prisma from '../config/database';
import { config } from '../config/env';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
  teamId?: string;
}

/**
 * Socket.io Server initialisieren
 */
export const initializeSocket = (httpServer: HTTPServer): SocketIOServer => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: config.corsOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Socket-Authentifizierung Middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication token missing'));
      }

      const payload = verifyToken(token);
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (!user || !user.isActive) {
        return next(new Error('User not found or inactive'));
      }

      // User-Daten an Socket anhängen
      socket.userId = user.id;
      socket.userEmail = user.email;
      socket.teamId = user.teamId;

      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  // Socket-Verbindung
  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`User connected: ${socket.userEmail} (${socket.userId})`);

    // User seinem Team-Room beitreten lassen
    if (socket.teamId) {
      socket.join(`team:${socket.teamId}`);
      logger.debug(`User ${socket.userEmail} joined team room: ${socket.teamId}`);
    }

    // User seinem persönlichen Room beitreten lassen
    socket.join(`user:${socket.userId}`);

    // Online-Status broadcasten
    io.to(`team:${socket.teamId}`).emit('user:online', {
      userId: socket.userId,
      email: socket.userEmail,
    });

    // Task-Updates subscriben
    socket.on('task:subscribe', (taskId: string) => {
      socket.join(`task:${taskId}`);
      logger.debug(`User ${socket.userEmail} subscribed to task: ${taskId}`);
    });

    socket.on('task:unsubscribe', (taskId: string) => {
      socket.leave(`task:${taskId}`);
    });

    // Task-Status Update (wird von anderen Clients empfangen)
    socket.on('task:update', (data: { taskId: string; changes: unknown }) => {
      logger.debug(`Task update from ${socket.userEmail}:`, data);

      // Broadcast an alle im Task-Room
      socket.to(`task:${data.taskId}`).emit('task:updated', {
        taskId: data.taskId,
        changes: data.changes,
        updatedBy: {
          userId: socket.userId,
          email: socket.userEmail,
        },
      });

      // Auch an Team broadcasten
      if (socket.teamId) {
        socket.to(`team:${socket.teamId}`).emit('task:changed', {
          taskId: data.taskId,
        });
      }
    });

    // Typing-Indikator für Kommentare
    socket.on('comment:typing', (data: { taskId: string }) => {
      socket.to(`task:${data.taskId}`).emit('comment:typing', {
        taskId: data.taskId,
        user: {
          userId: socket.userId,
          email: socket.userEmail,
        },
      });
    });

    // Neuer Kommentar
    socket.on('comment:new', (data: { taskId: string; comment: unknown }) => {
      io.to(`task:${data.taskId}`).emit('comment:created', {
        taskId: data.taskId,
        comment: data.comment,
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.userEmail}`);

      // Offline-Status broadcasten
      if (socket.teamId) {
        io.to(`team:${socket.teamId}`).emit('user:offline', {
          userId: socket.userId,
          email: socket.userEmail,
        });
      }
    });
  });

  return io;
};

/**
 * Helper: Event an bestimmten User senden
 */
export const emitToUser = (io: SocketIOServer, userId: string, event: string, data: unknown): void => {
  io.to(`user:${userId}`).emit(event, data);
};

/**
 * Helper: Event an Team senden
 */
export const emitToTeam = (io: SocketIOServer, teamId: string, event: string, data: unknown): void => {
  io.to(`team:${teamId}`).emit(event, data);
};

/**
 * Helper: Event an alle senden
 */
export const emitToAll = (io: SocketIOServer, event: string, data: unknown): void => {
  io.emit(event, data);
};
