import { Request } from 'express';
import { User } from '@prisma/client';

// Erweitert Express Request mit authentifiziertem User
export interface AuthRequest extends Request {
  user?: User;
}

// Socket.io User
export interface SocketUser {
  userId: string;
  email: string;
  name: string;
  teamId: string;
}

// Microsoft Account Token Response
export interface MicrosoftTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  id_token: string;
}

// Microsoft User Info
export interface MicrosoftUserInfo {
  id: string;
  displayName: string;
  mail: string;
  userPrincipalName: string;
}

// JWT Payload
export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Leaderboard Entry
export interface LeaderboardEntry {
  userId: string;
  name: string;
  email: string;
  teamName: string;
  totalPoints: number;
  level: number;
  completedTasks: number;
  rank: number;
}

// Team Statistics
export interface TeamStats {
  teamId: string;
  teamName: string;
  teamType: string;
  memberCount: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  openTasks: number;
  totalPoints: number;
  currentCapacity: number;
  maxCapacity: number;
  utilizationPercentage: number;
}

// Dashboard Data
export interface DashboardData {
  user: {
    name: string;
    email: string;
    totalPoints: number;
    level: number;
    rank: number;
  };
  todayTasks: number;
  overdueTask: number;
  completedThisWeek: number;
  upcomingDeadlines: Array<{
    taskId: string;
    title: string;
    dueDate: Date;
    priority: string;
  }>;
}
