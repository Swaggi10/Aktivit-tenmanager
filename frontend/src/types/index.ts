// User & Auth Types
export enum Role {
  ADMIN = 'ADMIN',
  TEAM_LEADER = 'TEAM_LEADER',
  MEMBER = 'MEMBER',
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: Role;
  teamId: string;
  team: Team;
  totalPoints: number;
  level: number;
  isActive: boolean;
  lastActive: Date;
  createdAt: Date;
}

// Team Types
export enum TeamType {
  LEADGEN_MAIL = 'LEADGEN_MAIL',
  AKQUISE = 'AKQUISE',
  SALES_DEV = 'SALES_DEV',
}

export interface Team {
  id: string;
  name: string;
  type: TeamType;
  description?: string;
  color: string;
  maxCapacity: number;
  createdAt: Date;
}

// Task Types
export enum TaskStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  COMPLETED = 'COMPLETED',
  BLOCKED = 'BLOCKED',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export interface Subtask {
  id: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  pointsReward: number;
  createdAt: Date;
  completedAt?: Date;
}

export interface Comment {
  id: string;
  content: string;
  mentions: string[];
  taskId: string;
  authorId: string;
  author: User;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  estimatedHours?: number;
  actualHours?: number;
  dueDate?: Date;
  teamId: string;
  team: Team;
  assignedToId?: string;
  assignedTo?: User;
  createdById: string;
  createdBy: User;
  pointsReward: number;
  subtasks: Subtask[];
  comments: Comment[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

// Gamification Types
export enum AchievementType {
  FIRST_TASK = 'FIRST_TASK',
  TASK_STREAK_5 = 'TASK_STREAK_5',
  TASK_STREAK_10 = 'TASK_STREAK_10',
  TEAM_PLAYER = 'TEAM_PLAYER',
  SPEED_DEMON = 'SPEED_DEMON',
  PERFECTIONIST = 'PERFECTIONIST',
  EARLY_BIRD = 'EARLY_BIRD',
  TEAM_LEADER_MONTH = 'TEAM_LEADER_MONTH',
  CENTURY = 'CENTURY',
  LEGEND = 'LEGEND',
}

export interface Achievement {
  id: string;
  type: AchievementType;
  name: string;
  description: string;
  icon: string;
  pointsReward: number;
}

export interface UserAchievement extends Achievement {
  unlockedAt: Date;
}

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

export interface TeamStats {
  teamId: string;
  teamName: string;
  teamType: TeamType;
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

// Notification Types
export enum NotificationType {
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_DUE_SOON = 'TASK_DUE_SOON',
  TASK_OVERDUE = 'TASK_OVERDUE',
  MENTIONED = 'MENTIONED',
  COMMENT_ADDED = 'COMMENT_ADDED',
  ACHIEVEMENT_EARNED = 'ACHIEVEMENT_EARNED',
  TASK_COMPLETED = 'TASK_COMPLETED',
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  userId: string;
  relatedId?: string;
  isRead: boolean;
  createdAt: Date;
}

// API Response
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
