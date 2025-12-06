import prisma from '../config/database';
import { Role, TaskStatus } from '@prisma/client';

/**
 * User Workload Information
 */
export interface UserWorkload {
  userId: string;
  name: string;
  email: string;
  teamId: string;
  teamName: string;
  role: Role;
  weeklyCapacity: number;
  currentLoad: number;
  utilizationPercentage: number;
  activeTasks: number;
  overdueTasks: number;
  isOverloaded: boolean;
  isUnderutilized: boolean;
}

/**
 * Alle Benutzer abrufen (Admin)
 */
export const getAllUsers = async () => {
  return prisma.user.findMany({
    include: {
      team: true,
      assignedTasks: {
        where: {
          status: {
            in: [TaskStatus.OPEN, TaskStatus.IN_PROGRESS],
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  });
};

/**
 * Benutzer nach E-Mail finden
 */
export const findUserByEmail = async (email: string) => {
  return prisma.user.findUnique({
    where: { email },
    include: { team: true },
  });
};

/**
 * Benutzer einem Team zuweisen (Admin)
 */
export const assignUserToTeam = async (userId: string, teamId: string) => {
  // Prüfe ob Team existiert
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) {
    throw new Error('Team not found');
  }

  return prisma.user.update({
    where: { id: userId },
    data: { teamId },
    include: { team: true },
  });
};

/**
 * Benutzerrolle ändern (Admin)
 */
export const updateUserRole = async (userId: string, role: Role) => {
  return prisma.user.update({
    where: { id: userId },
    data: { role },
    include: { team: true },
  });
};

/**
 * Neuen Benutzer erstellen (Admin)
 */
export const createUser = async (data: {
  email: string;
  name: string;
  teamId: string;
  role?: Role;
  weeklyCapacity?: number;
}) => {
  // Prüfe ob E-Mail bereits existiert
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new Error('User with this email already exists');
  }

  // Prüfe ob Team existiert
  const team = await prisma.team.findUnique({ where: { id: data.teamId } });
  if (!team) {
    throw new Error('Team not found');
  }

  return prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      teamId: data.teamId,
      role: data.role || Role.MEMBER,
      weeklyCapacity: data.weeklyCapacity || 5.0,
    },
    include: { team: true },
  });
};

/**
 * Benutzer aktualisieren (Admin)
 */
export const updateUser = async (
  userId: string,
  data: {
    name?: string;
    teamId?: string;
    role?: Role;
    weeklyCapacity?: number;
    isActive?: boolean;
  }
) => {
  if (data.teamId) {
    const team = await prisma.team.findUnique({ where: { id: data.teamId } });
    if (!team) {
      throw new Error('Team not found');
    }
  }

  return prisma.user.update({
    where: { id: userId },
    data,
    include: { team: true },
  });
};

/**
 * Benutzer deaktivieren (Admin)
 */
export const deactivateUser = async (userId: string) => {
  return prisma.user.update({
    where: { id: userId },
    data: { isActive: false },
  });
};

/**
 * Workload für alle Benutzer berechnen
 */
export const getAllUsersWorkload = async (teamId?: string): Promise<UserWorkload[]> => {
  const whereClause = teamId ? { teamId, isActive: true } : { isActive: true };

  const users = await prisma.user.findMany({
    where: whereClause,
    include: {
      team: true,
      assignedTasks: {
        where: {
          status: {
            in: [TaskStatus.OPEN, TaskStatus.IN_PROGRESS],
          },
        },
      },
    },
  });

  const now = new Date();

  return users.map((user) => {
    const currentLoad = user.assignedTasks.reduce(
      (sum, task) => sum + (task.estimatedHours || 0),
      0
    );

    const overdueTasks = user.assignedTasks.filter(
      (task) => task.dueDate && new Date(task.dueDate) < now
    ).length;

    const utilizationPercentage =
      user.weeklyCapacity > 0
        ? Math.round((currentLoad / user.weeklyCapacity) * 100)
        : 0;

    return {
      userId: user.id,
      name: user.name,
      email: user.email,
      teamId: user.teamId,
      teamName: user.team.name,
      role: user.role,
      weeklyCapacity: user.weeklyCapacity,
      currentLoad,
      utilizationPercentage,
      activeTasks: user.assignedTasks.length,
      overdueTasks,
      isOverloaded: utilizationPercentage > 100,
      isUnderutilized: utilizationPercentage < 50 && user.assignedTasks.length > 0,
    };
  });
};

/**
 * Überladene Benutzer finden (>100% Auslastung)
 */
export const getOverloadedUsers = async (teamId?: string): Promise<UserWorkload[]> => {
  const allWorkload = await getAllUsersWorkload(teamId);
  return allWorkload.filter((user) => user.isOverloaded);
};

/**
 * Unterauslastete Benutzer finden (<50% Auslastung)
 */
export const getUnderutilizedUsers = async (teamId?: string): Promise<UserWorkload[]> => {
  const allWorkload = await getAllUsersWorkload(teamId);
  return allWorkload.filter((user) => user.utilizationPercentage < 50);
};

/**
 * Benutzer mit überfälligen Aufgaben finden
 */
export const getUsersWithOverdueTasks = async (teamId?: string): Promise<UserWorkload[]> => {
  const allWorkload = await getAllUsersWorkload(teamId);
  return allWorkload.filter((user) => user.overdueTasks > 0);
};

/**
 * Dashboard-Daten für Admin
 */
export const getAdminDashboardData = async () => {
  const allWorkload = await getAllUsersWorkload();

  const overloadedUsers = allWorkload.filter((u) => u.isOverloaded);
  const underutilizedUsers = allWorkload.filter((u) => u.utilizationPercentage < 50);
  const usersWithOverdue = allWorkload.filter((u) => u.overdueTasks > 0);

  // Team-Statistiken
  const teams = await prisma.team.findMany({
    include: {
      members: { where: { isActive: true } },
      tasks: true,
    },
  });

  const teamStats = teams.map((team) => {
    const teamMembers = allWorkload.filter((u) => u.teamId === team.id);
    const totalCapacity = teamMembers.reduce((sum, m) => sum + m.weeklyCapacity, 0);
    const totalLoad = teamMembers.reduce((sum, m) => sum + m.currentLoad, 0);

    return {
      teamId: team.id,
      teamName: team.name,
      teamType: team.type,
      memberCount: team.members.length,
      totalTasks: team.tasks.length,
      completedTasks: team.tasks.filter((t) => t.status === TaskStatus.COMPLETED).length,
      openTasks: team.tasks.filter((t) => t.status === TaskStatus.OPEN).length,
      inProgressTasks: team.tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length,
      totalCapacity,
      currentLoad: totalLoad,
      utilizationPercentage: totalCapacity > 0 ? Math.round((totalLoad / totalCapacity) * 100) : 0,
    };
  });

  // Überfällige Aufgaben
  const overdueTasks = await prisma.task.findMany({
    where: {
      dueDate: { lt: new Date() },
      status: { notIn: [TaskStatus.COMPLETED] },
    },
    include: {
      assignedTo: true,
      team: true,
    },
    orderBy: { dueDate: 'asc' },
    take: 10,
  });

  return {
    summary: {
      totalUsers: allWorkload.length,
      overloadedCount: overloadedUsers.length,
      underutilizedCount: underutilizedUsers.length,
      overdueTaskCount: usersWithOverdue.reduce((sum, u) => sum + u.overdueTasks, 0),
    },
    overloadedUsers,
    underutilizedUsers,
    teamStats,
    overdueTasks,
    allUsersWorkload: allWorkload,
  };
};
