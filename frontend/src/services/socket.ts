import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

class SocketService {
  private socket: Socket | null = null;

  connect(token: string): Socket {
    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  // Task Events
  subscribeToTask(taskId: string): void {
    this.socket?.emit('task:subscribe', taskId);
  }

  unsubscribeFromTask(taskId: string): void {
    this.socket?.emit('task:unsubscribe', taskId);
  }

  updateTask(taskId: string, changes: unknown): void {
    this.socket?.emit('task:update', { taskId, changes });
  }

  onTaskUpdated(callback: (data: unknown) => void): void {
    this.socket?.on('task:updated', callback);
  }

  // Comment Events
  sendTypingIndicator(taskId: string): void {
    this.socket?.emit('comment:typing', { taskId });
  }

  onCommentTyping(callback: (data: unknown) => void): void {
    this.socket?.on('comment:typing', callback);
  }

  sendNewComment(taskId: string, comment: unknown): void {
    this.socket?.emit('comment:new', { taskId, comment });
  }

  onCommentCreated(callback: (data: unknown) => void): void {
    this.socket?.on('comment:created', callback);
  }

  // User Presence
  onUserOnline(callback: (data: { userId: string; email: string }) => void): void {
    this.socket?.on('user:online', callback);
  }

  onUserOffline(callback: (data: { userId: string; email: string }) => void): void {
    this.socket?.on('user:offline', callback);
  }
}

export const socketService = new SocketService();
